---
title: "Hot 100 算法题解：哈希、数组、链表、树与图"
description: "通过 53 道题掌握哈希、双指针、滑动窗口、数组、链表、树与图，附 C++ 和 Python 实现。"
pubDate: 2026-11-05
tags:
  - "算法"
  - "C++"
  - "Python"
category: knowledge
cover: /covers/research/algorithm.webp
---

本文按题目顺序整理 Hot 100 中的 53 道题，覆盖哈希、双指针、滑动窗口、数组、矩阵、链表、二叉树和图。每题列出题目要求、示例、解题思路，以及 C++ 与 Python 实现，并说明代码中值得留意的语言特性与易混点。代码按 LeetCode 提交接口编写；部分 C++ 使用 C++20，独立运行时需按代码补充标准库头文件或 Python 导入。

## 两数之和

**题目描述：** 给定整数数组 `nums` 和整数 `target`，请返回两个不同元素的下标，使它们对应的数之和等于 `target`。题目保证恰有一组解；同一位置不能使用两次，两个下标的返回顺序不限。

**示例：** `nums = [2, 7, 11, 15]`，`target = 9`，输出 `[0, 1]`。

**解题思路：**
1. 从左到右扫描数组，用哈希表记录已经看过的数值及其下标。
2. 对当前值 `x`，先查找 `target - x`；找到就返回补数下标和当前下标。
3. 若未找到，再把当前值及下标放入表中。先查后存可避免重复使用当前元素。

### C++ 代码
```cpp
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int,int> um;
        for(int i=0;i<nums.size();++i){
            if(um.contains(target-nums[i])){
                return {um[target-nums[i]], i};
            }
            um[nums[i]] = i;
        }
        return {};
    }
};
```
**C++ 知识点：**
- `unordered_map::contains` 从 C++20 起可用；它只检查键是否存在，不会像 `um[key]` 那样在缺少键时插入默认值。
- 下标 `0` 是有效结果，判断键是否存在不能依赖映射值的真假。

### Python 代码
```python
class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        hashtable = {}
        for i,num in enumerate(nums):
            if target-num in hashtable:
                return [i, hashtable[target-num]]
            hashtable[num] = i
        return []
        
```
**Python 知识点：**
- `enumerate(nums)` 同时产生下标和值，适合需要返回下标的遍历。
- `target - num in hashtable` 检查键是否存在；不要用 `hashtable.get(...)` 的真假判断，因为对应下标可能是 `0`。

## 字母异位词分组

**题目描述：** 给定只含小写英文字母的字符串数组 `strs`，请把由相同字母、且每个字母出现次数也相同的字符串归为一组。返回的组与组内元素顺序不限。

**示例：** `strs = ["eat", "tea", "tan", "ate", "nat", "bat"]`，输出可为 `[["eat", "tea", "ate"], ["tan", "nat"], ["bat"]]`。

**解题思路：**
1. 为每个字符串构造能唯一表示其字母组成的签名：可以排序字符，也可以统计 26 个字母的频次。
2. 用签名作为哈希表键，把原字符串追加到对应分组。
3. 收集哈希表中的所有分组作为结果；签名相同当且仅当两个字符串互为字母异位词。

### C++ 代码
```cpp
class Solution {
public:
    string countAna(const string& s){
        int ana[26] = {0};
        string ans;
        for(char a: s){
            ana[a-'a']++;
        }
        for(int i=0;i<26;++i){
            ans += 'a'+i;
            ans += to_string(ana[i]);
        }
        return ans;
    }

    vector<vector<string>> groupAnagrams(vector<string>& strs) {
        unordered_map<string, vector<string>> um;
        vector<vector<string>> res;
        for(const string& s:strs){
            string s_ana = countAna(s);
            um[s_ana].push_back(s);
        }
        res.reserve(um.size());
        for(auto& [k,v]:um) res.push_back(std::move(v));
        return res;
    }
};
```
**C++ 知识点：**
- 频次数组 `ana[26]` 用 `s[i] - 'a'` 将小写字母映射到下标；这种写法依赖输入字符限定为 `a` 到 `z`。
- `auto& [k, v]` 是 C++17 结构化绑定；`std::move(v)` 将分组向量转移到结果中，避免复制元素。被移动的 `v` 仍可析构或重新赋值，但不能依赖其原内容。

### Python 代码
```python
class Solution:
    def groupAnagrams(self, strs: list[str]) -> list[list[str]]:
        hashtable = {}
        for s in strs:
            str_sort = str(sorted(s))
            if str_sort in hashtable:
                hashtable[str_sort].append(s)
            else:
                hashtable[str_sort] = [s]
        return [l for l in hashtable.values()]
```
**Python 知识点：**
- `sorted(s)` 返回列表，列表不可作为字典键；代码用 `str(sorted(s))` 生成可哈希签名，也可用 `tuple(sorted(s))` 表达得更直接。
- 字典的 `values()` 可直接遍历所有分组；这里的列表是可变对象，追加时会原地修改该分组。

## 最长连续序列

**题目描述：** 给定未排序整数数组 `nums`，返回数组中最长连续整数序列的长度。序列中的整数在原数组里不必相邻，重复值只算一次；要求平均时间复杂度为 O(n)。

**示例：** `nums = [100, 4, 200, 1, 3, 2]`，输出 `4`，最长序列为 `[1, 2, 3, 4]`。

**解题思路：**
1. 把所有元素放入哈希集合，去掉重复值并支持平均 O(1) 的成员查询。
2. 只从没有前驱 `x - 1` 的数开始扩展；若前驱存在，当前数属于更早开始的序列。
3. 不断查找后继并统计长度，更新最大值；空集合的答案为 `0`。

### C++ 代码
```cpp
class Solution {
public:
    int longestConsecutive(vector<int>& nums) {
        unordered_set<int> nums_set(nums.begin(),nums.end());
        int ans = 0;
        for(int num:nums_set){
            if(nums_set.contains(num-1)){
                continue;
            }
            int temp_max = 1;
            while(nums_set.contains(num+1)){
                temp_max++;
                num++;
            }
            ans = (ans<temp_max)?temp_max:ans;
        }
        return ans;
    }
};
```
**C++ 知识点：**
- `unordered_set<int> nums_set(nums.begin(), nums.end())` 用迭代器范围一次构造集合。
- `contains` 是 C++20 的成员查询；`for (int num : nums_set)` 拿到元素副本，因此循环中递增 `num` 不会改动集合。

### Python 代码
```python
class Solution:
    def longestConsecutive(self, nums: list[int]) -> int:
        nums_set = set(nums)
        ans = 0
        for num in nums_set:
            if num-1 not in nums_set:
                temp_ans = 1
                while(num+1 in nums_set):
                    temp_ans += 1
                    num += 1
                ans = max(ans, temp_ans)
        return ans
```
**Python 知识点：**
- `set(nums)` 自动去重，且 `x in nums_set` 平均为 O(1)。
- 循环中的 `num += 1` 只重新绑定局部整数变量，不会改变集合；Python 整数也不会发生定长整数溢出。

## 移动零

**题目描述：** 给定整数数组 `nums`，请将所有 `0` 移到数组末尾，并保持非零元素原来的相对顺序。必须直接修改输入数组，不能另建数组保存结果。

**示例：** `nums = [0, 1, 0, 3, 12]`，原地修改为 `[1, 3, 12, 0, 0]`。

**解题思路：**
1. 用 `r` 从左到右扫描，用 `l` 指向下一个应放置非零值的位置。
2. 遇到非零值时，将它与 `l` 位置交换，然后将 `l` 右移；遇到零时只移动扫描指针。
3. 扫描结束后，前半部分是原顺序的非零元素，剩余位置自然为零。

### C++ 代码
```cpp
class Solution {
public:
    void moveZeroes(vector<int>& nums) {
        int l = -1;
        int temp;
        for(int r=0;r<nums.size();++r){
            if(nums[r]==0)continue;
            else{
                l++;
                temp = nums[r];
                nums[r] = nums[l];
                nums[l] = temp;
            }
        }
    }
};
```
**C++ 知识点：**
- 参数 `vector<int>& nums` 是非 const 引用，函数对它的交换会直接修改调用者的数组。
- 当前位置与自身交换是合法的，因此无需额外判断 `l == r`。

### Python 代码
```python
class Solution:
    def moveZeroes(self, nums: list[int]) -> None:
        """
        Do not return anything, modify nums in-place instead.
        """
        l = -1
        for r in range(len(nums)):
            if nums[r]==0:
                continue
            else:
                l += 1
                nums[r], nums[l] = nums[l], nums[r]
```
**Python 知识点：**
- `nums[r], nums[l] = nums[l], nums[r]` 先求出右侧两个旧值，再同时完成赋值，不需要临时变量。
- 返回类型 `None` 对应题目要求原地修改；答案留在传入的列表中。

## 盛水最多的容器

**题目描述：** 给定非负整数数组 `height`，`height[i]` 表示横坐标 `i` 处竖线的高度。任选两条不同竖线，与横轴围成容器；容器不能倾斜，返回它能盛的最大水量。

**示例：** `height = [1, 8, 6, 2, 5, 4, 8, 3, 7]`，输出 `49`。

**解题思路：**
1. 用左右指针从数组两端开始，当前容积是两指针间距乘较短的线高。
2. 更新最大容积后，移动较短的一侧；移动较高一侧不会提高当前受限高度，只会缩短宽度。
3. 直到左右指针相遇，返回记录的最大值。

### C++ 代码
```cpp
class Solution {
public:
    int minHeight(int a, int b){
        return (a+b-abs(a-b)) / 2;
    }
    int maxArea(vector<int>& height) {
        int l = 0;
        int r = height.size() - 1;
        int max = 0;
        int area = 0;
        while(l<r){
            if(height[l]<=height[r]){
                area = height[l]*(r-l);
                l++;
            }
            else{
                area = height[r]*(r-l);
                r--;
            }
            max = (max<area)? area:max;
        }
        return max;
    }
};
```
**C++ 知识点：**
- 局部变量名 `max` 会遮蔽同名的标准库函数 `std::max`；当前函数没有调用它，实际代码中用 `best` 之类名称更不易混淆。
- 成员函数 `minHeight` 使用绝对值公式计算较小值，但主函数直接比较两端高度，并没有调用它。

### Python 代码
```python
class Solution:
    def maxArea(self, height: list[int]) -> int:
        l, r = 0, len(height)-1
        max_, area = 0, 0
        while(l<r):
            if height[l]<=height[r]:
                area = height[l]*(r-l)
                l += 1
            else:
                area = height[r]*(r-l)
                r -= 1
            max_ = max(max_, area)
        return max_
```
**Python 知识点：**
- `max_` 用于保存最大面积，避免遮蔽内置函数 `max()`。
- `l, r = 0, len(height) - 1` 是多个目标同时赋值，右侧表达式先求值。

## 三数之和

**题目描述：** 给定整数数组 `nums`，请找出所有三个不同下标对应元素之和为 `0` 的三元组。结果中不能有数值相同的重复三元组，三元组及结果的排列顺序不限。

**示例：** `nums = [-1, 0, 1, 2, -1, -4]`，输出 `[[-1, -1, 2], [-1, 0, 1]]`。

**解题思路：**
1. 先将数组排序，固定第一个数 `nums[i]`，再用左右指针在其右侧寻找和为 `-nums[i]` 的两数。
2. 两数和偏小时左指针右移，偏大时右指针左移；相等时记录三元组并移动两端。
3. 固定数和命中后的左右值都要跳过重复项，避免重复结果；排序后也可用边界条件提前结束或跳过不可能的起点。

### C++ 代码
```cpp
class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& nums) {
        vector<vector<int>> ans;
        sort(nums.begin(),nums.end());
        int n = nums.size();
        for(int i=0; i<n-2;++i){
            int x = nums[i];
            if(x>0) break;
            if(x+nums[i+1]+nums[i+2]>0) break;
            if(x+nums[n-1]+nums[n-2]<0) continue;
            if(i>0 && x==nums[i-1]){
                continue;
            }
            
            int l = i+1;
            int r = n-1;
            while(l<r){
                if(nums[l]+nums[r]<-x){
                    l++;
                    while(l<r && nums[l]==nums[l-1]){
                        l++;
                    }
                }else if(nums[l]+nums[r]>-x){
                    r--;
                    while(l<r && nums[r]==nums[r+1]){
                        r--;
                    }
                }else{
                    ans.push_back({nums[i],nums[l],nums[r]});
                    l++;r--;
                    while(l<r && nums[l]==nums[l-1]){
                        l++;
                    }
                    while(l<r && nums[r]==nums[r+1]){
                        r--;
                    }
                }
            }
            
        }
        return ans;
    }
};
```
**C++ 知识点：**
- `sort(nums.begin(), nums.end())` 会原地改变传入的 `vector`；若调用方需要保留原顺序，应先复制。
- 跳过重复值时要先保证指针仍在范围内，再读取相邻元素，避免越界。

### Python 代码
```python
class Solution:
    def threeSum(self, nums: list[int]) -> list[list[int]]:
        nums.sort()
        ans = []
        n = len(nums)
        for i in range(n-2):
            if nums[i]>0: break
            if nums[i]+nums[i+1]+nums[i+2]>0: break
            if nums[i]+nums[n-1]+nums[n-2]<0: continue
            if i>0 and nums[i]==nums[i-1]:
                continue
            l, r = i+1, n-1
            while(l<r):
                if nums[l]+nums[r]<-nums[i]:
                    l += 1
                    while(nums[l]==nums[l-1] and l<r):
                        l += 1
                elif nums[l]+nums[r]>-nums[i]:
                    r -= 1
                    while(nums[r]==nums[r+1] and r>l):
                        r -= 1
                else:
                    ans.append([nums[i], nums[l], nums[r]])
                    l += 1
                    r -= 1
                    while(nums[l]==nums[l-1] and l<r):
                        l += 1
                    while(nums[r]==nums[r+1] and r>l):
                        r -= 1
        return ans
```
**Python 知识点：**
- `nums.sort()` 原地排序并返回 `None`；它与 `sorted(nums)`（返回新列表）不同。
- 短路表达式中的边界判断应放在数组访问之前，保证越界时后半部分不再求值。

## 接雨水

**题目描述：** 给定非负整数数组 `height`，每根柱子宽度均为 `1`。相邻柱子之间可能积水，请返回下雨后所有位置能接住的水量总和。

**示例：** `height = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]`，输出 `6`。

**解题思路：**
1. 积水高度由左侧最高柱、右侧最高柱和当前位置柱高共同决定。
2. 用左右指针和两侧已知最高值处理数组；当前端较低时，该端可接的水量已由其最高值确定。
3. 逐格累计最高值与当前高度之差，直到两指针交错。

### C++ 代码
```cpp
class Solution {
public:
    int trap(vector<int>& height) {
        int n = height.size();
        int l=0, r=n-1;
        int l_m=0, r_m=0;
        int ans = 0;
        while(l<=r){
            if(height[l]<=height[r]){
                l_m = (l_m<height[l])?height[l]:l_m;
                ans += l_m - height[l];
                l++;
            }else{
                r_m = (r_m<height[r])?height[r]:r_m;
                ans += r_m - height[r];
                r--;
            }
        }
        return ans;
    }
};
```
**C++ 知识点：**
- 代码用条件运算符更新 `l_m`、`r_m`，避免额外调用 `std::max`；两侧最高值只会增大。
- 循环条件 `l <= r` 会把最后一个相遇位置也处理一次。

### Python 代码
```python
class Solution:
    def trap(self, height: list[int]) -> int:
        n = len(height)
        l, r = 0, n-1
        l_m, r_m = 0, 0
        ans = 0
        while l<=r:
            if height[l]<=height[r]:
                if height[l]>l_m:
                    l_m = height[l]
                ans += l_m - height[l]
                l += 1
            else:
                if height[r]>r_m:
                    r_m = height[r]
                ans += r_m -height[r]
                r -= 1
        return ans
```
**Python 知识点：**
- Python 整数是任意精度整数，不会因累计水量超过固定整数位宽而溢出；C++ 的 `int` 则受题目约束影响。
- `l, r = 0, n - 1` 可同时初始化两个指针，之后必须确保每轮都移动其中一侧。

## 无重复字符的最长子串

**题目描述：** 给定字符串 `s`，请返回不含重复字符的最长连续子串长度。子串必须由原字符串中连续的一段字符组成；空字符串返回 `0`。

**示例：** `s = "abcabcbb"`，输出 `3`，最长子串之一为 `"abc"`。

**解题思路：**
1. 维护左边界 `l`，以及每个字符最近一次出现的下标。
2. 扫描到字符 `s[r]` 时，若它上次出现的位置仍在窗口内，就把 `l` 移到该位置后一格。
3. 更新当前窗口长度 `r - l + 1` 的最大值，并记录字符的新下标。

### C++ 代码
```cpp
class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        unordered_map<char, int> seen;
        int l=0;
        int ans = 0;
        for(int r=0;r<s.length();++r){
            if(seen.contains(s[r]) && seen[s[r]]>=l){
                l = seen[s[r]]+1;
            }
            seen[s[r]] = r;
            ans = (ans<(r-l+1))?r-l+1:ans;
        }
        return ans;
    }
};
```
**C++ 知识点：**
- `seen.contains(s[r])` 先确认键存在，再读取 `seen[s[r]]`；`unordered_map::contains` 需要 C++20。
- 比较上次下标是否 `>= l` 很关键：旧重复字符若已落在窗口外，不能把窗口左边界倒退。

### Python 代码
```python
class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        seen = {}
        l = 0
        ans = 0
        for r,ch in enumerate(s):
            if ch in seen and seen[ch]>=l:
                l = seen[ch]+1
            seen[ch] = r
            ans = max(ans, r-l+1)
        return ans
```
**Python 知识点：**
- 用 `if ch in seen` 检查字典键后再取 `seen[ch]`，避免把下标 `0` 的真假误判为不存在。
- 字典记录的是最近下标，不是窗口中所有字符；覆盖旧下标即可。

## 找到字符串中所有字母的异位词

**题目描述：** 给定只含小写英文字母的字符串 `s` 和非空字符串 `p`，返回 `s` 中所有与 `p` 字母种类及出现次数完全相同的连续子串起始下标。

**示例：** `s = "cbaebabacd"`，`p = "abc"`，输出 `[0, 6]`。

**解题思路：**
1. 统计 `p` 中 26 个字母的频次，并统计 `s` 开始处长度为 `len(p)` 的窗口。
2. 逐步右移固定长度窗口：加入新字符、移除离开窗口的字符。
3. 窗口频次与 `p` 的频次相同就记录窗口起点；长度不足时无需扫描。

### C++ 代码
```cpp
class Solution {
public:
    // 注意,c++中,两个数组不能直接用==判断相等,用std::equal(algorithm库)
    // 并且数组没有.begin,需要用begin(p_count)替代
    vector<int> findAnagrams(string s, string p) {
        int p_count[26] = {0};
        int win_count[26] = {0};
        int n=s.length(), m=p.length();
        if(n<m) return {};
        vector<int> ans;
        for(char ch:p){
            p_count[ch-'a']++;
        }
        for(int i=0;i<m;++i){
            win_count[s[i]-'a']++;
        }
        if(equal(begin(win_count),end(win_count),begin(p_count))) ans.push_back(0);
        for(int i=m;i<n;++i){
            win_count[s[i]-'a']++;
            win_count[s[i-m]-'a']--;
            if(equal(begin(win_count),end(win_count),begin(p_count))) ans.push_back(i-m+1);
        }
        return ans;
    }
};
```
**C++ 知识点：**
- 内置数组不能用 `==` 比较内容；这里用 `std::equal` 和 `begin` / `end` 比较两个频次数组。
- `ch - 'a'` 将小写字母映射为 `[0, 25]`，依赖题目限定字符范围。

### Python 代码
```python
class Solution:
    def findAnagrams(self, s: str, p: str) -> list[int]:
        p_count = [0]*26
        win_count = [0]*26
        ans = []
        if len(s)<len(p): return []
        for q in p:
            p_count[ord(q)-ord('a')] += 1
        for i in range(len(p)):
            win_count[ord(s[i])-ord('a')] += 1
        if win_count==p_count: ans.append(0)
        for r in range(len(p),len(s)):
            win_count[ord(s[r])-ord('a')] += 1
            win_count[ord(s[r-len(p)])-ord('a')] -= 1
            if win_count==p_count: ans.append(r-len(p)+1)
        return ans


```
**Python 知识点：**
- Python 列表的 `==` 会逐元素比较内容，因此两个 26 项频次数组可直接比较。
- `ord(ch) - ord('a')` 把小写字母转换为频次数组下标。

## 和为 K 的子数组

**题目描述：** 给定整数数组 `nums` 和整数 `k`，请统计元素和等于 `k` 的非空连续子数组个数。数组可含负数和零，位置不同的子数组分别计数。

**示例：** `nums = [1, 1, 1]`，`k = 2`，输出 `2`。

**解题思路：**
1. 遍历时维护当前前缀和 `prefix`。若之前出现过前缀和 `prefix - k`，两者之间的子数组和就是 `k`。
2. 哈希表记录每个前缀和出现的次数；初始将前缀和 `0` 记一次，以统计从数组开头开始的子数组。
3. 每一步先查询 `prefix - k` 的次数并加入答案，再登记当前 `prefix`，避免把空子数组计入。

### C++ 代码
```cpp
class Solution {
public:
    int subarraySum(vector<int>& nums, int k) {
        unordered_map<int,int> um;//记录某个前缀和值的出现次数
        int ans = 0, prefix = 0;
        um[prefix] = 1;
        for(int num:nums){
            prefix += num;
            if(um.contains(prefix-k)){
                ans += um[prefix-k];
            }
            um[prefix]++;
        }
        return ans;
    }
};
```
**C++ 知识点：**
- `um[0] = 1` 表示遍历任何元素之前有一个空前缀；`um[key]` 在键不存在时会插入值初始化的计数 `0`。
- 先查询再增加当前前缀和频次，能正确处理 `k == 0`。

### Python 代码
```python
class Solution:
    def subarraySum(self, nums: List[int], k: int) -> int:
        hashtable = {}
        prefix = 0
        ans = 0 
        hashtable[prefix] = 1 #前缀和更新就进行计数
        for x in nums:
            prefix += x
            ans += hashtable.get(prefix-k,0)
            hashtable[prefix] = hashtable.get(prefix,0) + 1
        return ans
```
**Python 知识点：**
- `dict.get(key, 0)` 可在键不存在时返回默认计数，而不必先判断键是否存在。
- 频次表保存“出现次数”而不只是出现过与否；同一前缀和重复出现会对应多个子数组。

## 滑动窗口最大值

**题目描述：** 给定整数数组 `nums` 和窗口大小 `k`，长度为 `k` 的窗口从左向右每次移动一格。请按窗口顺序返回每个窗口中的最大值；题目保证 `1 <= k <= len(nums)`。

**示例：** `nums = [1, 3, -1, -3, 5, 3, 6, 7]`，`k = 3`，输出 `[3, 3, 5, 5, 6, 7]`。

**解题思路：**
1. 用双端队列存下标，并保持这些下标对应的值从队首到队尾单调递减。
2. 每个新下标入队前，移除队尾所有不大于新值的元素；它们不可能再成为之后窗口的最大值。
3. 移除已滑出窗口的队首下标，队首对应值即当前窗口最大值。

### C++ 代码
```cpp
class Solution {
public:
    vector<int> maxSlidingWindow(vector<int>& nums, int k) {
        deque <int> dq;
        vector<int> ans;
        int n = nums.size();
        if(n<k) return {};

        for(int i=0;i<k;++i){
            while(!dq.empty() && nums[i]>nums[dq.back()]){
                dq.pop_back();
            }
            dq.push_back(i);
        }
        ans.push_back(nums[dq.front()]);
        for(int r=k;r<n;++r){
            if(dq.front()<r-k+1) dq.pop_front();
            while(!dq.empty() && nums[r]>nums[dq.back()]){
                dq.pop_back();
            }
            dq.push_back(r);
            ans.push_back(nums[dq.front()]);
        }
        return ans;
    }
};
```
**C++ 知识点：**
- 队列保存下标而非值，才能判断元素是否已经滑出窗口；`deque` 支持两端 O(1) 插入和删除。
- 用 `>` 保留相等值的较早下标，直到它过期；改成 `>=` 也可保留较新的相同最大值。

### Python 代码
```python
class Solution:
    def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:
        qu = deque()
        ans = []
        if len(nums)<k:return []

        for i in range(k):
            while(qu and nums[i]>nums[qu[-1]]):
                qu.pop()
            qu.append(i)
        ans.append(nums[qu[0]])

        for r in range(k, len(nums)):
            if(qu[0]<r-k+1):
                qu.popleft()
            while(qu and nums[r]>nums[qu[-1]]):
                    qu.pop()
            qu.append(r)
            ans.append(nums[qu[0]])
        return ans

```
**Python 知识点：**
- `collections.deque` 的 `popleft()` 是 O(1)；普通列表的 `pop(0)` 会搬移其余元素。
- 队列保存下标能同时取值 `nums[dq[0]]` 和判断窗口过期。

## 最小覆盖子串

**题目描述：** 给定字符串 `s` 和非空字符串 `t`，请返回 `s` 中包含 `t` 全部字符及相同重复次数的最短连续子串；若不存在则返回空字符串。

**示例：** `s = "ADOBECODEBANC"`，`t = "ABC"`，输出 `"BANC"`。

**解题思路：**
1. 统计 `t` 中每种字符还需要的数量，并记录尚未满足的不同字符种数。
2. 右边界向右扩展时扣减对应字符的需求；某种字符需求恰好降到 `0` 时，该种字符满足。
3. 所有字符满足后不断右移左边界，更新最短答案；移走必要字符导致需求重新大于 `0` 时停止收缩。

### C++ 代码
```cpp
class Solution {
public:
    string minWindow(string s, string t) {
        unordered_map<char, int> needs;
        int n=s.length(), m=t.length();
        if(n<m) return "";
        int l_ans=-1, r_ans=n;
        int l=0;
        for(char ch:t){
            needs[ch]++;
        }
        int kinds = needs.size();
        int getk = 0;
        for(int r=0;r<n;++r){
            needs[s[r]]--;
            if(needs[s[r]]==0){
                getk++;
            }
            while(getk==kinds){
                if(r-l<r_ans-l_ans){
                    r_ans = r;
                    l_ans = l;
                }
                needs[s[l]]++;
                if(needs[s[l]]>0){
                    getk--;
                }
                l++;
            }
        }
        return l_ans==-1?"":s.substr(l_ans,r_ans-l_ans+1);
    }
};
```
**C++ 知识点：**
- `unordered_map::operator[]` 读取未出现字符时会创建计数为 `0` 的键，因此窗口中多余字符的计数会变为负数。
- `substr(start, length)` 的第二个参数是长度；右端点包含在答案中时长度要加 `1`。

### Python 代码
```python
class Solution:
    def minWindow(self, s: str, t: str) -> str:
        n, m = len(s), len(t)
        if n<m: return ""
        needs = defaultdict(int)
        for ch in t:
            needs[ch] +=  1
        kinds = len(needs)
        getk = 0
        l_ans, r_ans = -1, n
        l, r = 0, 0
        # 窗口右扩展->满足条件记录->尝试缩短窗口
        for r in range(n):
            needs[s[r]] -= 1
            if needs[s[r]]==0:
                getk += 1
            while(getk==kinds):
                # 满足条件记录答案
                if(r-l<r_ans-l_ans):
                    l_ans, r_ans = l, r
                # 尝试缩短窗口,关键在于只有t里面的字符才可能出现needs[s[l]]>0
                needs[s[l]] += 1
                if needs[s[l]]>0:
                    getk -= 1
                l += 1
                
        return "" if l_ans==-1 else s[l_ans:r_ans+1]

```
**Python 知识点：**
- `defaultdict(int)` 访问新字符会自动得到 `0`；使用前需从 `collections` 导入。
- Python 切片右端不包含在结果中，所以包含 `r` 的窗口写成 `s[l:r + 1]`。

## 最大子数组和

**题目描述：** 给定非空整数数组 `nums`，返回和最大的非空连续子数组的元素和；数组元素可以为负数。

**示例：** `nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]`，输出 `6`，对应子数组 `[4, -1, 2, 1]`。

**解题思路：**
1. Kadane 写法：维护以当前位置结尾的最大子数组和；若前一段和不大于 `0`，就从当前元素重新开始。
2. 逐项更新全局最大和，不能把答案初始化为 `0`，否则全负数数组会得到错误结果。
3. 本题 Python 主实现使用分治：分别求左右半区答案，再计算跨越中点的最大后缀与最大前缀和。

### C++ 代码
```cpp
class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        //基础思想就是,过去是负担就重新开始
        int temp = 0;
        int ans = INT_MIN;
        for(int num:nums){
            if(temp<=0){
                temp = num;
            }else{
                temp += num;
            }
            ans = (ans<temp)?temp:ans;
        }
        return ans;

    }
};
```
**C++ 知识点：**
- `INT_MIN` 用作非空数组最大和的初始值，避免全负数输入时返回 `0`。
- 范围 `for (int num : nums)` 会复制当前整数；这里不需要修改原数组元素。

### Python 代码
```python
class Solution:
    def maxSubArray1(self, nums: list[int]) -> int:
        cur = nums[0]
        ans = nums[0]
        for x in nums[1:]:
            cur = max(x, cur + x)
            ans = max(ans, cur)
        return ans
    def maxSubArray(self, nums: list[int]) -> int:
        def cross(l,m,r):
            s = 0
            left_sum = float('-inf')
            for i in range(m,l-1,-1):
                s += nums[i]
                left_sum = max(s,left_sum)
            s = 0
            right_sum = float('-inf')
            for i in range(m+1, r+1):
                s += nums[i]
                right_sum = max(s, right_sum)
            return left_sum + right_sum
        def solve(l,r):
            if(l==r): return nums[l]
            m = (l+r) // 2
            return max(solve(l,m), solve(m+1,r), cross(l,m,r))
        return solve(0,len(nums)-1)
```
**Python 知识点：**
- 代码同时保留 Kadane 版本 `maxSubArray1` 和分治主版本 `maxSubArray`；提交时调用同名入口实际指向后者。
- 分治函数 `solve` 在单元素区间作为递归基，Python 的 `//` 用于取得整数中点。

## 合并区间

**题目描述：** 给定由起点和终点组成的闭区间列表 `intervals`，请合并所有相交或端点相接的区间，并返回互不重叠的区间列表。

**示例：** `intervals = [[1, 3], [2, 6], [8, 10], [15, 18]]`，输出 `[[1, 6], [8, 10], [15, 18]]`。

**解题思路：**
1. 按区间起点升序排序。
2. 依次检查当前区间与结果中最后一个区间：若前者终点小于当前起点，就新增区间；否则合并并扩大终点。
3. 遍历结束后，结果中的区间已按起点排序且彼此不重叠。

### C++ 代码
```cpp
class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end(),
             [](const auto& a, const auto& b){ return a[0] < b[0]; });

        vector<vector<int>> res;
        res.reserve(intervals.size());

        for (const auto& interval : intervals) {
            if (res.empty() || res.back()[1] < interval[0]) {
                res.push_back(interval);
            } else {
                res.back()[1] = std::max(res.back()[1], interval[1]);
            }
        }
        return res;
    }
};
```
**C++ 知识点：**
- 排序比较器是 lambda：`[](const auto& a, const auto& b)` 按首元素比较，引用参数避免复制区间。
- `res.back()` 只能在 `res` 非空时调用，因此代码先用 `res.empty()` 保护。

### Python 代码
```python
class Solution:
    def merge(self, intervals: list[list[int]]) -> list[list[int]]:
        intervals.sort(key=lambda x:x[0])
        res = []
        for interval in intervals:
            if not res or res[-1][1]<interval[0]:
                res.append(interval)
            else:
                res[-1][1] = max(res[-1][1], interval[1])
        return res
```
**Python 知识点：**
- `intervals.sort(key=lambda x: x[0])` 根据起点原地排序；`key` 函数只需返回排序依据。
- `res.append(interval)` 保存的是同一个内层列表引用，随后修改 `res[-1][1]` 也会改到原输入中的对应区间。

## 轮转数组

**题目描述：** 给定非空整数数组 `nums` 和非负整数 `k`，请将数组整体向右轮转 `k` 个位置，并原地修改。例如末尾元素轮转后回到数组开头。

**示例：** `nums = [1, 2, 3, 4, 5, 6, 7]`，`k = 3`，原地修改为 `[5, 6, 7, 1, 2, 3, 4]`。

**解题思路：**
1. 先令有效轮转步数为 `k % n`，其中 `n` 是数组长度。
2. 代码实现了两种方法：循环替换沿置换环搬移元素；三次反转则先反转全数组，再分别反转前 `k` 项和剩余部分。
3. 当 `k` 为 `0` 或数组长度的倍数时，结果保持不变。

### C++ 代码
```cpp
class Solution {
public:
    void reverse(vector<int>& nums, int l, int r){
        int temp;
        while(l<r){
            temp = nums[l];
            nums[l] = nums[r];
            nums[r] = temp;
            l++;r--;
        }
    }
    void rotate(vector<int>& nums, int k) {
        int n = nums.size();
        k %= n;

        int count = 0;
        int start = 0;
        int cur, prev, nxt, temp;
        while(count<n){
            cur = start;
            prev = nums[start];
            while(1){
                nxt = (cur+k)%n;
                temp = nums[nxt];
                nums[nxt] = prev;
                prev = temp;
                cur = nxt;
                count++;
                if(cur==start){
                    break;
                }
            }
            start++;
        }
    }
    void rotate1(vector<int>& nums, int k) {
        int n = nums.size();
        k %= n;
        
        reverse(nums, 0, n-1);
        reverse(nums, 0, k-1);
        reverse(nums, k, n-1);
    }
};
```
**C++ 知识点：**
- `k %= n` 将步数缩到 `[0, n - 1]`；该代码依赖题目保证数组非空，空 `vector` 会导致除以零。
- 反转函数的左右端点是闭区间，调用时要确认 `k == 0` 对应的 `0..-1` 区间不会进入循环。

### Python 代码
```python
class Solution:
    def rotate(self, nums: list[int], k: int) -> None:
        n = len(nums)
        k %= n
        count = 0
        start = 0
        while(count < n):
            cur = start
            prev = nums[start]
            while True:
                nxt = (cur+k)%n
                nums[nxt], prev = prev, nums[nxt]
                cur = nxt
                count += 1
                if cur == start:
                    break
            start += 1

    def rotate1(self, nums: list[int], k: int) -> None:
        def reverseNums(l: int, r: int) -> None:
            while(l<r):
                nums[l], nums[r] = nums[r], nums[l]
                l += 1
                r -= 1
        n = len(nums)
        k %= n
        reverseNums(0,n-1)
        reverseNums(0,k-1)
        reverseNums(k,n-1)
        
            
```
**Python 知识点：**
- `nums[a], nums[b] = nums[b], nums[a]` 可交换列表元素，不需临时变量。
- 与 C++ 相同，`k %= n` 之前需有 `n > 0`；题目给出的非空保证满足此前提。

## 除了自身以外数组的乘积

**题目描述：** 给定整数数组 `nums`，构造等长数组 `answer`，使 `answer[i]` 等于除 `nums[i]` 外所有元素的乘积。不能使用除法，且题目要求 O(n) 时间。

**示例：** `nums = [1, 2, 3, 4]`，输出 `[24, 12, 8, 6]`。

**解题思路：**
1. 先从左向右遍历，让 `answer[i]` 保存 `i` 左侧所有元素的乘积。
2. 再从右向左维护右侧乘积，将它乘入 `answer[i]`，然后把当前元素加入右侧乘积。
3. 除输出数组外只维护常数个变量，零元素也无需单独分支。

### C++ 代码
```cpp
class Solution {
public:
    vector<int> productExceptSelf(vector<int>& nums) {
        int n = nums.size();
        vector<int> ans(n,1);
        for(int i=1;i<n;++i){
            ans[i] = ans[i-1]*nums[i-1];
        }
        int subfix = 1;
        for(int i=n-1;i>-1;--i){
            ans[i] *= subfix;
            subfix *= nums[i];
        }
        return ans;
    }
};
```
**C++ 知识点：**
- `ans` 先保存前缀积，第二趟用 `subfix` 累积后缀积并乘回；这样无需再建一个后缀数组。
- 乘积使用 `int`，正确性依赖题目保证中间结果和答案处于该类型范围内。

### Python 代码
```python
class Solution:
    def productExceptSelf(self, nums: List[int]) -> List[int]:
        n = len(nums)
        ans = [1]*n
        for i in range(1,n):
            ans[i] = ans[i-1]*nums[i-1]
        subfix = 1
        for i in range(n-1,-1,-1):
            ans[i] = ans[i]*subfix
            subfix *= nums[i]
        return ans
```
**Python 知识点：**
- `[1] * n` 在这里可安全初始化，因为整数不可变；可变内层列表不适合用同样方式创建多行矩阵。
- 第二趟从 `range(n - 1, -1, -1)` 倒序遍历，终点 `-1` 不包含在范围内。

## 缺失的第一个正数

**题目描述：** 给定未排序整数数组 `nums`，请返回数组中没有出现的最小正整数。要求在线性时间内完成，并且除原数组外只使用常数额外空间。

**示例：** `nums = [3, 4, -1, 1]`，输出 `2`。

**解题思路：**
1. 长度为 `n` 的数组中，答案只可能在 `1` 到 `n + 1` 之间。
2. 把每个处于 `[1, n]` 范围内的数交换到下标 `数值 - 1` 的位置；若目标位置已放着相同值就停止交换。
3. 从下标 `0` 开始找第一个不满足 `nums[i] == i + 1` 的位置，其对应值就是答案；若都匹配则答案为 `n + 1`。

### C++ 代码
```cpp
class Solution {
public:
    int firstMissingPositive1(vector<int>& nums) {
        sort(nums.begin(),nums.end());
        int expected = 1;
        for(int num:nums){
            if(num>expected){
                return expected;
            }
            if(num==expected){
                expected++;
            }
        }
        return expected;
    }
    int firstMissingPositive(vector<int>& nums) {
        int n =nums.size();
        int j;
        for(int i=0;i<n;++i){
            while((nums[i]>=1 && nums[i]<=n) && nums[i]!=nums[nums[i]-1]){
                j = nums[i]-1;
                std::swap(nums[i], nums[j]);
            }
        }
        for(int i=0;i<n;++i){
            if(static_cast<long long>(nums[i])-1!=i){
                return i+1;
            }
        }
        return n+1;
    }
};
```
**C++ 知识点：**
- 主实现通过原地交换把数值 `x` 放到下标 `x - 1`，辅助排序版本不满足题目要求的线性时间。
- `static_cast<long long>(nums[i]) - 1` 在减法前扩宽类型，避免 `INT_MIN - 1` 发生有符号溢出。

### Python 代码
```python
class Solution:
    def firstMissingPositive(self, nums: list[int]) -> int:
        # 先排座位
        n = len(nums)
        for i in range(n):
            while(0<nums[i]<=n and nums[i]!=nums[nums[i]-1]):
                j = nums[i] - 1
                nums[i], nums[j] = nums[j], nums[i]
        # 再遍历座位
        for i in range(n):
            if nums[i]-1!=i:
                return i+1
        
        
        return n+1
```
**Python 知识点：**
- `0 < nums[i] <= n` 是 Python 链式比较，等价于两个条件同时成立。
- Python 整数无固定宽度溢出；原地交换用多目标赋值，交换前右侧值会先求出。

## 矩阵置零

**题目描述：** 给定非空二维矩阵 `matrix`，若某个位置原本为 `0`，则将该位置所在的整行和整列都置为 `0`。必须原地修改，不能让新写入的零继续触发其他行列。

**示例：** `matrix = [[1, 1, 1], [1, 0, 1], [1, 1, 1]]`，修改为 `[[1, 0, 1], [0, 0, 0], [1, 0, 1]]`。

**解题思路：**
1. 先单独记录第一行和第一列原本是否含零，因为它们随后要充当标记区。
2. 扫描其余单元格；遇到零时，将对应行首和列首位置标为零。
3. 根据标记清零内部区域，最后按两个布尔标记处理第一行和第一列。Python 代码还保留了使用独立行列标记数组的版本。

### C++ 代码
```cpp
class Solution {
public:
    void setZeroes(vector<vector<int>>& matrix) {
        bool first_row=false, first_col=false;
        int m=matrix.size(), n=matrix[0].size();
        for(int num:matrix[0]){//首行
            if(num==0){
                first_row=true;
                break;
            }
        }
        for(int i=0;i<m;++i){
            if(matrix[i][0]==0){
                first_col=true;
                break;
            }
        }
        for(int i=1;i<m;++i){
            for(int j=1;j<n;++j){
                if(matrix[i][j]==0){
                    matrix[i][0]=0;
                    matrix[0][j]=0;
                }
            }
        }
        for(int i=1;i<m;++i){
            for(int j=1;j<n;++j){
                if(matrix[i][0]==0 || matrix[0][j]==0){
                    matrix[i][j]=0;
                }
            }
        }
        if(first_row){
            for(int j=0;j<n;++j){
                matrix[0][j]=0;
            }
        }
        if(first_col){
            for(int i=0;i<m;++i){
                matrix[i][0]=0;
            }
        }
    }
};
```
**C++ 知识点：**
- 第一行和第一列同时承担标记作用，因此必须先保存它们原本是否含零，不能直接清零后再判断。
- 参数是二维 `vector` 的非 const 引用，标记写入会直接改变输入矩阵。

### Python 代码
```python
class Solution:
    def setZeroes1(self, matrix: list[list[int]]) -> None:
        m, n = len(matrix), len(matrix[0])
        row = [False]*m
        col = [False]*n
        for i in range(m):
            for j in range(n):
                if(matrix[i][j]==0):
                    row[i], col[j] = True, True
        for i in range(m):
            for j in range(n):
                if(row[i] or col[j]):
                    matrix[i][j] = 0
    def setZeroes(self, matrix: list[list[int]]) -> None:
        m, n = len(matrix), len(matrix[0])
        first_row = False
        first_col = False
        for i in range(n):
            if not matrix[0][i]:
                first_row = True
                break
        for j in range(m):
            if not matrix[j][0]:
                first_col = True
                break
        for i in range(1,m):
            for j in range(1,n):
                if(matrix[i][j]==0):
                    matrix[i][0], matrix[0][j] = 0, 0
        for i in range(1,m):
            for j in range(1,n):
                if(not matrix[i][0] or not matrix[0][j]):
                    matrix[i][j] = 0
        if first_row:
            for j in range(n):
                matrix[0][j] = 0
        if first_col:
            for i in range(m):
                matrix[i][0] = 0
```
**Python 知识点：**
- `setZeroes1` 用 `row`、`col` 额外数组标记；主方法复用矩阵首行首列来省空间。
- 布尔矩阵应写成 `[[False] * n for _ in range(m)]`；`[[False] * n] * m` 会让所有行引用同一个列表。

## 螺旋矩阵

**题目描述：** 给定非空 `m × n` 矩阵 `matrix`，请从左上角开始按顺时针螺旋顺序遍历，并返回所有元素组成的列表。

**示例：** `matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]`，输出 `[1, 2, 3, 6, 9, 8, 7, 4, 5]`。

**解题思路：**
1. 用 `top`、`bottom`、`left`、`right` 表示尚未遍历的矩形边界。
2. 依次遍历上边、右边、下边、左边，每走完一条边就收缩相应边界。
3. 遍历下边和左边前检查边界是否仍有效，避免单行或单列矩阵被重复加入。

### C++ 代码
```cpp
class Solution {
public:
    vector<int> spiralOrder(vector<vector<int>>& matrix) {
        //4边界法
        int m = matrix.size(), n = matrix[0].size();
        int left = 0, right = n-1;
        int top = 0, bottom = m-1;
        vector<int> ans;
        ans.reserve(m*n);

        while(left<=right && top<=bottom){
            for(int i=left;i<=right;++i){
                ans.push_back(matrix[top][i]);
            }top++;
            
            for(int i=top;i<=bottom;++i){
                ans.push_back(matrix[i][right]);
            }right--;

            if(left<=right && top<=bottom){
                for(int i=right;i>=left;--i){
                    ans.push_back(matrix[bottom][i]);
                }bottom--;
            }

            if(left<=right && top<=bottom){
                for(int i=bottom;i>=top;--i){
                    ans.push_back(matrix[i][left]);
                }left++;
            }
        }
        return ans;
    }
};
```
**C++ 知识点：**
- 边界变量使用有符号整数，允许 `right` 或 `bottom` 在收缩后变为 `-1` 并参与结束判断。
- 矩阵以 `vector<vector<int>>` 表示，行数和列数需分别从外层和首行取得。

### Python 代码
```python
class Solution:
    def spiralOrder(self, matrix: list[list[int]]) -> list[int]:
        # 右下左上的顺序,关键在于每次走完一行列,就会有边界收缩的效果,可以做visited,但是额外空间太大,四个变量记录边界即可
        m, n = len(matrix), len(matrix[0])
        left, right = 0, n-1
        top, bottom = 0, m-1
        ans = []
        # 在移动之前需要进行判断,是否满足可移动条件
        while left<=right and top<=bottom:
            for i in range(left, right+1):
                ans.append(matrix[top][i])
            top += 1

            # 向下走的时候,经过分析和尝试,不判断也不会影响结果
            for i in range(top, bottom+1):
                ans.append(matrix[i][right])
            right -= 1
        
            if left<=right and top<=bottom:
                for i in range(right, left-1, -1):
                    ans.append(matrix[bottom][i])
                bottom -= 1
            
            if left<=right and top<=bottom:
                for i in range(bottom, top-1, -1):
                    ans.append(matrix[i][left])
                left += 1
        return ans
```
**Python 知识点：**
- 用 `len(matrix)` 和 `len(matrix[0])` 分别得到行数与列数；题目保证矩阵非空。
- 收缩边界后仍可能留下一行或一列，因此下半圈遍历需要再次检查 `top <= bottom`、`left <= right`。

## 旋转图像

**题目描述：** 给定 `n × n` 二维矩阵 `matrix`，请将矩阵原地顺时针旋转 90 度；不得另建矩阵保存结果。

**示例：** `matrix = [[1, 2], [3, 4]]`，修改为 `[[3, 1], [4, 2]]`。

**解题思路：**
1. 沿主对角线转置矩阵，使行列坐标互换。
2. 转置时只处理对角线下方（或上方），避免把已经交换的元素再换回来。
3. 逐行反转，完成顺时针 90 度旋转。

### C++ 代码
```cpp
class Solution {
public:
    void T(vector<vector<int>>& matrix,int n){
        for(int i=0;i<n;++i){
            for(int j=0;j<i;++j){
                swap(matrix[i][j], matrix[j][i]);
            }
        }
    }
    void row_reverse(vector<vector<int>>& matrix,int n){
        for(int i=0;i<n;++i){
            int left=0, right=n-1;
            while(left<right){
                swap(matrix[i][left],matrix[i][right]);
                left++;right--;
            }
        }
    }
    void rotate(vector<vector<int>>& matrix) {
        //先转置,再逐行反转
        int n=matrix.size();
        T(matrix,n);
        row_reverse(matrix,n);
    }
};
```
**C++ 知识点：**
- `swap(matrix[i][j], matrix[j][i])` 需要包含提供 `std::swap` 的标准头文件；LeetCode 环境通常预置常用头文件。
- 只遍历 `j < i` 可以让每对对称元素交换一次；再逐行交换首尾元素。

### Python 代码
```python
class Solution:
    def rotate(self, matrix: list[list[int]]) -> None:
        def T(matrix, n):
            for i in range(n):
                for j in range(i):
                    matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
        def row_reverse(matrix,n):
            for i in range(n):
                left, right = 0, n-1
                while(left<right):
                    matrix[i][left], matrix[i][right] = matrix[i][right], matrix[i][left]
                    left += 1
                    right -= 1
        n = len(matrix)
        T(matrix,n)
        row_reverse(matrix,n)
```
**Python 知识点：**
- 矩阵及其行都是可变列表，所以对称位置赋值会原地修改输入。
- 多目标赋值可直接交换 `matrix[i][j]` 与 `matrix[j][i]`，同样只需访问对角线一侧。

## 搜索二维矩阵 II

**题目描述：** 给定整数矩阵 `matrix` 和目标值 `target`。矩阵每行从左到右递增、每列从上到下递增；请判断目标值是否存在。

**示例：** `matrix = [[1, 4, 7], [2, 5, 8], [3, 6, 9]]`，`target = 6`，输出 `true`。

**解题思路：**
1. 从右上角开始查找；该位置是当前行最大值，也是当前列最小值。
2. 当前值大于目标时，整列都不可能是答案，向左移；当前值小于目标时，整行都不可能是答案，向下移。
3. 越出矩阵边界仍未命中时返回 `false`。

### C++ 代码
```cpp
class Solution {
public:
    bool searchMatrix(vector<vector<int>>& matrix, int target) {
        int m=matrix.size(), n=matrix[0].size();
        int i=0, j=n-1;
        while(i<m && j>=0){
            if(target==matrix[i][j]){
                return true;
            }else if(target>matrix[i][j]){
                i++;
            }else{
                j--;
            }
        }
        return false;
    }
};
```
**C++ 知识点：**
- 列下标 `j` 用有符号 `int`，这样减到 `-1` 后可直接判断；无符号下标减一可能回绕成极大值。
- 二维 `vector` 的 `matrix[i][j]` 访问是 O(1)，每一步至少排除一行或一列。

### Python 代码
```python
class Solution:
    def searchMatrix(self, matrix: List[List[int]], target: int) -> bool:
        m, n = len(matrix), len(matrix[0])
        i, j = 0, n-1
        while(0<=i<=m-1 and 0<=j<=n-1):
            if(target==matrix[i][j]):
                return True
            elif(target<matrix[i][j]):
                j -= 1
            else:
                i += 1
        return False
```
**Python 知识点：**
- `0 <= i <= m - 1` 是链式比较，等价于 `0 <= i and i <= m - 1`。
- 从右上角开始后，指针只能向左或向下，最多移动 `m + n` 步。

## 相交链表

**题目描述：** 给定两个无环单链表 `headA` 和 `headB`，返回它们开始共享的第一个节点；若没有共享节点则返回空。相交按节点身份判断，不是节点值相等。

**示例：** 链表 A 为 `4 → 1 → 8 → 4 → 5`，链表 B 为 `5 → 6 → 1 → 8 → 4 → 5`，两链表共享从值为 `8` 的同一节点开始的尾部，返回该节点。

**解题思路：**
1. 分别用指针遍历两个链表；到达末尾后改从另一个链表头重新开始。
2. 若链表相交，两指针最终走过相同总长度并在共享节点相遇；若不相交，则同时到达空节点。
3. 比较的是节点本身而非 `val`，因此相同数值的不同节点不算相交。

### C++ 代码
```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode(int x) : val(x), next(NULL) {}
 * };
 */
class Solution {
public:
    ListNode *getIntersectionNode(ListNode *headA, ListNode *headB) {
        // 关键就是都走同样数量个节点
        ListNode* pa = headA;
        ListNode* pb = headB;

        while(pa!=pb){
            pa = (pa==nullptr)?headB:pa->next;
            pb = (pb==nullptr)?headA:pb->next;
        }
        return pa;
        
    }
};
```
**C++ 知识点：**
- `ListNode*` 保存节点地址，`pa == pb` 比较的是地址身份；`pa->next` 是通过指针访问成员。
- `nullptr` 表示空指针；条件运算符可在到达末尾时切换到另一条链表头。

### Python 代码
```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, x):
#         self.val = x
#         self.next = None

class Solution:
    def getIntersectionNode(self, headA: ListNode, headB: ListNode) -> Optional[ListNode]:
        pa = headA
        pb = headB
        while(pa!=pb):
            pa = headB if pa is None else pa.next
            pb = headA if pb is None else pb.next
        return pa
```
**Python 知识点：**
- 链表引用比较要表达节点身份；普通 LeetCode `ListNode` 未重载相等运算时 `==` 与身份比较一致，写 `is` 更明确。
- `Optional[ListNode]` 表示变量既可能是节点，也可能是 `None`。

## 反转链表

**题目描述：** 给定单链表头节点 `head`，请反转链表中所有节点的指向，并返回反转后的新头节点。空链表仍返回空。

**示例：** `1 → 2 → 3 → 4 → 5`，反转后为 `5 → 4 → 3 → 2 → 1`。

**解题思路：**
1. 用 `prev` 保存已反转部分的头，`cur` 指向当前待处理节点。
2. 每轮先保存 `cur.next`，再令 `cur.next = prev`，然后将 `prev`、`cur` 向前推进。
3. 遍历结束时 `prev` 指向新头节点。

### C++ 代码
```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode* prev = nullptr;
        ListNode* cur = head;
        while(cur!=nullptr){
            ListNode* nxt = cur->next;
            cur->next = prev;
            prev = cur;
            cur = nxt;
        }
        return prev;
    }
};
```
**C++ 知识点：**
- 修改 `cur->next` 前必须先保存原来的后继 `nxt`，否则后半段链表会丢失。
- 空指针用 `nullptr` 表示；函数只重连节点，没有创建新节点。

### Python 代码
```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def reverseList(self, head: ListNode | None) -> ListNode | None:
        prev = None
        cur = head
        while(cur):
            nxt = cur.next
            cur.next = prev
            prev = cur
            cur = nxt
        return prev

```
**Python 知识点：**
- `cur = None` 可作为已反转部分的前驱边界，之后通过 `cur.next` 重连节点。
- `ListNode | None` 是 Python 3.10 起的联合类型标注写法。

## 回文链表

**题目描述：** 给定单链表头节点 `head`，判断从头到尾读取的节点值是否构成回文序列。空链表和只有一个节点的链表均视为回文。

**示例：** `1 → 2 → 2 → 1`，输出 `true`。

**解题思路：**
1. 快慢指针找到前半部分末尾；奇数长度时慢指针停在正中间，偶数长度时停在中间靠左节点。
2. 反转后半部分链表，再从头节点与反转后的后半部分头节点同时向前比较。
3. 任何对应值不同就不是回文；全部匹配则是回文。当前实现会保留反转后的链表结构，不会恢复原链表。

### C++ 代码
```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
    ListNode* reverseLinked(ListNode* head){
        ListNode* prev = nullptr;
        ListNode* cur = head;
        while(cur){
            ListNode* nxt = cur->next;
            cur->next = prev;
            prev = cur;
            cur = nxt;
        }
        return prev;
    }
    bool isPalindrome(ListNode* head) {
        //快慢指针找中间,反转后面再遍历
        if(!head || head->next==nullptr){
            return true;
        }
        ListNode* fast = head, *slow = head;
        //快指针到最后一个位置,慢指针到前半最后一个位置(偶数为中间靠左,奇数为中间)
        while(fast->next!=nullptr && fast->next->next!=nullptr){
            fast = fast->next->next;
            slow = slow->next;
        }
        //反转后面
        slow->next = reverseLinked(slow->next);
        slow = slow->next;
        ListNode* cur = head;
        while(slow){
            if(cur->val!=slow->val){
                return false;
            }
            slow = slow->next;
            cur = cur->next;
        }
        return true;
    }
};
```
**C++ 知识点：**
- 循环条件同时检查 `fast->next` 和 `fast->next->next`，保证每次快指针前进两步时不会解引用空指针。
- 反转第二半会修改原链表；若调用方要求结构不变，比较后还需再反转一次恢复。

### Python 代码
```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:#简单来说,一共有三步,找到中间(靠左)节点,反转后面节点,同时遍历前半和后半
    def NodeofFirstHalf(self, head):
        fast, slow = head, head
        while(fast.next is not None and fast.next.next is not None):
            fast = fast.next.next
            slow = slow.next
        return slow
    
    def reverseLinked(self, head):
        prev = None
        cur = head
        while(cur):
            nxt = cur.next
            cur.next = prev
            prev = cur
            cur = nxt
        return prev
    
    def judgment(self, first, second):
        while(second):
            if(first.val!=second.val):
                return False
            first = first.next
            second = second.next
        return True
    
    def isPalindrome(self, head: Optional[ListNode]) -> bool:
        firstHalfNode = self.NodeofFirstHalf(head)
        firstHalfNode.next = self.reverseLinked(firstHalfNode.next)
        return self.judgment(head, firstHalfNode.next) 
```
**Python 知识点：**
- 辅助方法作为类实例方法调用时要显式传入 `self`，例如 `self.reverseLinked(...)`。
- 当前实现没有先判断 `head is None`，空链表输入会在找中点时访问 `None.next`；需要覆盖空链表时应先返回 `True`。
- 反转后半链表会改变原链表结构；若调用方要求结构不变，比较后还需再反转一次恢复。

## 环形链表

**题目描述：** 给定单链表头节点 `head`，判断链表中是否存在环。若沿 `next` 指针最终会再次到达已经访问过的节点，则链表有环。

**示例：** `head = [3, 2, 0, -4]`，尾节点连接到下标 `1` 的节点，输出 `true`。

**解题思路：**
1. 设置慢指针每次走一步、快指针每次走两步。
2. 若链表无环，快指针会先到达空节点；若有环，快慢指针最终会在环内相遇。
3. 比较相遇的节点身份即可判断，不能只比较节点值。

### C++ 代码
```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode(int x) : val(x), next(NULL) {}
 * };
 */
class Solution {
public:
    bool hasCycle(ListNode *head) {
        //关键在于,快慢指针找相交节点的思路
        ListNode *fast=head,*slow=head;
        while(fast && fast->next){
            fast = fast->next->next;
            slow = slow->next;
            if(fast==slow){
                return true;
            }
        }
        return false;
    }
};
```
**C++ 知识点：**
- `while (fast && fast->next)` 先检查指针非空，再安全地读取后继；`&&` 会短路。
- 快慢指针应比较指针地址，而不是 `fast->val` 与 `slow->val`。

### Python 代码
```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, x):
#         self.val = x
#         self.next = None

class Solution:
    def hasCycle(self, head: Optional[ListNode]) -> bool:
        if not head: return False
        fast, slow = head, head
        while(fast.next is not None and fast.next.next is not None):
            fast = fast.next.next
            slow = slow.next
            if(fast is slow):
                return True
        return False
```
**Python 知识点：**
- `fast is slow` 明确比较两个变量是否引用同一个节点；节点值相同不足以证明相遇。
- 快指针每次前进前要确保它和 `fast.next` 都不是 `None`。

## 环形链表 II

**题目描述：** 给定单链表头节点 `head`，若链表存在环，返回环的入口节点；若不存在环，返回空节点。

**示例：** `head = [3, 2, 0, -4]`，尾节点连接到下标 `1` 的节点，返回下标 `1`、值为 `2` 的节点。

**解题思路：**
1. 先用快慢指针判断是否有环，并记录两指针在环内的相遇节点。
2. 若相遇，将一根指针放回链表头，另一根留在相遇处。
3. 两指针每次各走一步，再次相遇的位置就是环入口；若第一步未相遇则返回空。

### C++ 代码
```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode(int x) : val(x), next(NULL) {}
 * };
 */
class Solution {
public:
    ListNode *detectCycle(ListNode *head) {
        //关键在于,快慢指针,加上环的部分和其余部分是相交
        ListNode *fast=head,*slow=head;
        bool flag = false;
        while(fast && fast->next){
            fast = fast->next->next;
            slow = slow->next;
            if(fast==slow){
                flag = true;
                break;
            }
        }
        fast = head;
        while(flag && fast!=slow){
            fast = fast->next;
            slow = slow->next;
        }
        return flag?fast:nullptr;
    }
};
```
**C++ 知识点：**
- `flag` 用来区分快慢指针是否真的相遇；没有相遇时不能套用入口定位步骤。
- 返回 `ListNode*` 是返回原链表中的节点地址，不需要复制节点。

### Python 代码
```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, x):
#         self.val = x
#         self.next = None

class Solution:
    def detectCycle(self, head: Optional[ListNode]) -> Optional[ListNode]:
        # 1.快慢指针看是否有环 2.开头和环内节点开始找相交,交点就是入环第一个节点
        fast=slow=head
        while(fast and fast.next):
            fast = fast.next.next
            slow = slow.next
            if(fast is slow):
                fast = head
                while(fast is not slow):
                    fast = fast.next
                    slow = slow.next
                return fast
        return None
```
**Python 知识点：**
- `fast = head` 是让变量重新引用头节点，不会复制链表。
- `while fast and fast.next` 利用短路顺序防止访问空指针；入口比较用节点身份。

## 合并两个有序链表

**题目描述：** 给定两个按非递减顺序排列的单链表 `list1` 和 `list2`，请合并成一个同样有序的链表并返回头节点。可以直接复用输入链表中的节点。

**示例：** `list1 = [1, 2, 4]`，`list2 = [1, 3, 4]`，输出 `[1, 1, 2, 3, 4, 4]`。

**解题思路：**
1. 用两个指针分别查看两条链表当前节点，每次把较小节点接到合并链表末尾。
2. 被接入的链表指针向后移动，合并链表尾指针也向后移动。
3. 其中一条链表耗尽后，将另一条剩余部分整体接到末尾。

### C++ 代码
```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {
        if(!(list1&&list2)){
            return list1?list1:list2;
        }
        ListNode *dummy = new(ListNode);
        ListNode *p1=list1, *p2=list2, *cur=dummy;
        while(p1 && p2){
            if(p1->val<=p2->val){
                cur->next = p1;
                p1 = p1->next;
                cur = cur->next;
            }else{
                cur->next = p2;
                p2 = p2->next;
                cur = cur->next;
            }
        }
        if(p1) cur->next = p1;
        if(p2) cur->next = p2;
        return dummy->next;
    }
};
```
**C++ 知识点：**
- 代码中的 `new ListNode`（或 `new(ListNode)`）在堆上创建哑节点；若使用动态分配，需考虑释放内存，局部栈对象通常更适合作哑节点。
- 通过 `ListNode*` 重连原节点，不会复制节点值或节点对象。

### Python 代码
```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def mergeTwoLists(self, list1: ListNode | None, list2: ListNode | None) -> ListNode | None:
        if not list1 or not list2:
            return list1 if not list2 else list2
        p1 = list1
        p2 = list2
        if(p1.val<=p2.val):
            ans = p1
            p1 = p1.next
        else:
            ans = p2
            p2 = p2.next
        cur = ans
        while(p1 and p2):
            if(p1.val<=p2.val):
                cur.next = p1
                p1 = p1.next
                cur = cur.next
            else:
                cur.next = p2
                p2 = p2.next
                cur = cur.next
        if(p1):
            cur.next = p1
        if(p2):
            cur.next = p2
        return ans
```
**Python 知识点：**
- Python 版本同样重连输入节点的 `next`，没有构造每个值的新节点。
- `list1 if ... else ...` 是条件表达式，可在一行中选择尚未耗尽的链表。

## 两数相加

**题目描述：** 两个非空单链表 `l1`、`l2` 分别以逆序存储一个非负整数的各位数字，每个节点存一位。请将两数相加，并以相同的逆序链表形式返回结果。

**示例：** `l1 = [2, 4, 3]`，`l2 = [5, 6, 4]`，输出 `[7, 0, 8]`，表示 `342 + 465 = 807`。

**解题思路：**
1. 从两个链表头部同时开始逐位相加，不足位数的一侧按 `0` 处理。
2. 每轮用 `sum % 10` 生成当前位，用 `sum / 10` 的整数商更新进位。
3. 只要仍有输入节点或进位就继续；用哑节点简化结果链表的首节点处理。

### C++ 代码
```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
    ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {
        ListNode* p1 = l1;
        ListNode* p2 = l2;
        int carry = 0;
        ListNode dummy = ListNode();
        ListNode* cur = &dummy;
        while(p1 || p2 || carry){
            int val1 = p1?p1->val:0;
            int val2 = p2?p2->val:0;
            int sum_ = val1+val2+carry;
            cur->next = new ListNode(sum_%10);
            cur = cur->next;
            carry = sum_ / 10;
            if(p1) p1=p1->next;
            if(p2) p2=p2->next;
        }
        return dummy.next;
    }
};
```
**C++ 知识点：**
- C++ 整数除法对非负整数执行向零截断，这里等同于整除；`sum_ % 10` 取得当前位。
- 局部哑节点 `dummy` 的生命周期覆盖整个函数，返回其 `next` 所指向的新节点即可。

### Python 代码
```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def addTwoNumbers(self, l1: ListNode | None, l2: ListNode | None) -> ListNode | None:
        p1 = l1
        p2 = l2
        carry = 0
        dummy = ListNode()
        cur = dummy
        while(p1 or p2 or carry):
            val1 = p1.val if p1 else 0
            val2 = p2.val if p2 else 0
            sum_ = val1+val2+carry
            cur.next = ListNode(sum_%10)
            cur = cur.next
            carry = sum_ // 10
            if(p1): p1=p1.next
            if(p2): p2=p2.next

        return dummy.next
```
**Python 知识点：**
- `//` 是向下取整除法；本题 `sum_` 始终非负，因此与 C++ 整数除法结果一致。
- 条件表达式 `p1.val if p1 else 0` 可处理某条链表提前结束的位数。

## 删除链表的倒数第 N 个结点

**题目描述：** 给定单链表头节点 `head` 和有效整数 `n`，删除链表中倒数第 `n` 个节点，并返回删除后的头节点。

**示例：** `head = [1, 2, 3, 4, 5]`，`n = 2`，输出 `[1, 2, 3, 5]`。

**解题思路：**
1. 在头节点前添加哑节点，使删除头节点也能统一处理。
2. 快指针先从哑节点出发前进 `n + 1` 步，再让快慢指针同步前进，直到快指针到达空。
3. 此时慢指针位于待删除节点的前一个节点，跳过待删除节点并返回哑节点的后继。

### C++ 代码
```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
    ListNode* removeNthFromEnd(ListNode* head, int n) {
        ListNode dummy = ListNode();
        dummy.next = head;
        ListNode *fast=&dummy, *slow=&dummy;//slow是删除节点的上一个
        for(int i;i<=n;++i){
            fast = fast->next;
        }
        while(fast){
            fast = fast->next;
            slow = slow->next;
        }
        slow->next = slow->next->next;
        return dummy.next;
    }
};
```
**C++ 知识点：**
- 哑节点让“删除首节点”和删除中间节点使用同一条 `slow->next = slow->next->next` 逻辑。
- 当前代码 `for (int i; i <= n; ++i)` 中 `i` 未初始化，读取它会产生未定义行为；循环变量应从 `0` 显式初始化。

### Python 代码
```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def removeNthFromEnd(self, head: ListNode | None, n: int) -> ListNode | None:
        dummy = ListNode()
        dummy.next = head
        fast = slow = dummy
        for _ in range(n+1):
            fast = fast.next
        while(fast):
            fast = fast.next
            slow = slow.next
        slow.next = slow.next.next
        return dummy.next
```
**Python 知识点：**
- `for _ in range(n + 1)` 中 `_` 表示循环次数有用、每轮值不用；前进 `n + 1` 步是为让慢指针停在删除节点前。
- `dummy.next` 作为返回值能覆盖删除原头节点的情况。

## 两两交换链表中的节点

**题目描述：** 给定单链表头节点 `head`，请每两个相邻节点交换一次，并返回新头节点。只能改变节点指针连接，不能只交换节点值；不足两个节点的一组保持原样。

**示例：** `head = [1, 2, 3, 4]`，输出 `[2, 1, 4, 3]`。

**解题思路：**
1. 使用哑节点和 `prev` 标记上一组的末尾，从 `prev.next` 取得当前组起点。
2. 确认当前组有两个节点，先保存下一组起点，再反转当前两节点，并把反转后的头接回 `prev`。
3. 当前组原头成为组尾，令它作为新的 `prev`，继续处理下一组；不足一组时结束。

### C++ 代码
```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
    ListNode* swapPairs(ListNode* head) {
        //记录上一组的末尾,找到这一组的末尾,记录下一组开头,反转当前组,接回原链表.进入下一组
        if(head==nullptr || head->next==nullptr) return head;
        ListNode dummy = ListNode();
        dummy.next = head;
        ListNode *prev = &dummy;
        while(1){
            //定位要处理的组,如果不够K个不处理了,直接退出返回就行
            ListNode* start = prev->next;
            ListNode* end = start;
            for(int i=0;i<2-1;++i){
                if(end==nullptr){
                    return dummy.next;
                }
                end = end->next;
            }
            if(end==nullptr) return dummy.next;
            ListNode* nextgroupstart = end->next;
            //组内反转并接回原链表
            ListNode* prev_ = nextgroupstart;
            ListNode* cur = start;
            while(cur!=nextgroupstart){
                ListNode* nxt = cur->next;
                cur->next = prev_;
                prev_ = cur;
                cur = nxt;
            }
            prev->next = end;

            //向后循环
            prev = start;
        }
        return dummy.next;
    }
};
```
**C++ 知识点：**
- `ListNode* prev = &dummy` 取局部哑节点地址；只要函数未返回，该地址就有效。
- 反转小组时把 `prev_` 初始设为下一组起点，可让原组尾自动接回未处理部分。

### Python 代码
```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def getKthNode(self,head,k):
        cur = head
        for _ in range(k-1):
            if(cur==None):
                return None
            cur = cur.next
        return cur

    def reverseLinked(self,start,nextgroupstart):
        prev_ = nextgroupstart
        cur = start
        while(cur is not nextgroupstart):
            nxt = cur.next
            cur.next = prev_
            prev_ = cur
            cur = nxt

    def swapPairs(self, head: ListNode | None) -> ListNode | None:
        if not head or not head.next:return head
        # 节点数>=2,类似两个一组反转链表,需要开始节点,结束节点
        dummy = ListNode()
        dummy.next = head
        prev = dummy
        while(True):
            start = prev.next
            end = self.getKthNode(start,2)
            if(end==None):break
            nextgroupstart = end.next
            self.reverseLinked(start,nextgroupstart)
            prev.next = end
            prev = start
        return dummy.next


```
**Python 知识点：**
- `getKthNode` 与 `reverseLinked` 是实例方法，调用时通过 `self` 传入当前对象。
- `while cur is not nextgroupstart` 用节点身份作为分组终止边界，避免误把值相同的节点当成边界。

## K 个一组翻转链表

**题目描述：** 给定单链表头节点 `head` 和正整数 `k`，每 `k` 个节点为一组进行反转；最后不足 `k` 个节点时保持原顺序。只能修改节点连接，不能修改节点值。

**示例：** `head = [1, 2, 3, 4, 5]`，`k = 2`，输出 `[2, 1, 4, 3, 5]`。

**解题思路：**
1. 用哑节点简化头部处理，定位每组的起点和第 `k` 个节点。
2. 若剩余节点不足 `k` 个，直接结束；否则先保存下一组起点，再将本组反转。
3. 把反转后的组头接到上一组末尾，并将本组原头（现为组尾）作为下一轮的上一组末尾。

### C++ 代码
```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
    ListNode* reverseKGroup(ListNode* head, int k) {
        //记录上一组的末尾,找到这一组的末尾,记录下一组开头,反转当前组,接回原链表.进入下一组
        if(head==nullptr || head->next==nullptr || k==1) return head;
        ListNode dummy = ListNode();
        dummy.next = head;
        ListNode *prev = &dummy;
        while(1){
            //定位要处理的组,如果不够K个不处理了,直接退出返回就行
            ListNode* start = prev->next;
            ListNode* end = start;
            for(int i=0;i<k-1;++i){
                if(end==nullptr){
                    return dummy.next;
                }
                end = end->next;
            }
            if(end==nullptr) return dummy.next;
            ListNode* nextgroupstart = end->next;
            //组内反转并接回原链表
            ListNode* prev_ = nextgroupstart;
            ListNode* cur = start;
            while(cur!=nextgroupstart){
                ListNode* nxt = cur->next;
                cur->next = prev_;
                prev_ = cur;
                cur = nxt;
            }
            prev->next = end;

            //向后循环
            prev = start;
        }
        return dummy.next;
    }
};
```
**C++ 知识点：**
- `prev_` 从 `nextgroupstart` 开始，反转时每个节点都接到前一个节点，最后一节点会自然连向下一组。
- 原始节点指针只表示节点身份；调整 `next` 不需要复制或交换 `val`。

### Python 代码
```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def getKthNode(self,head,k):
        cur = head
        for _ in range(k-1):
            if(cur==None):
                return None
            cur = cur.next
        return cur

    def reverseLinked(self,start,nextgroupstart):
        prev_ = nextgroupstart
        cur = start
        while(cur is not nextgroupstart):
            nxt = cur.next
            cur.next = prev_
            prev_ = cur
            cur = nxt

    def reverseKGroup(self, head: ListNode | None, k: int) -> ListNode | None:
        if not head or not head.next or k==1:return head
        dummy = ListNode()
        dummy.next = head
        prev = dummy
        while(True):
            start = prev.next
            end = self.getKthNode(start,k)
            if(end==None):break
            nextgroupstart = end.next
            self.reverseLinked(start,nextgroupstart)
            prev.next = end
            prev = start
        return dummy.next
```
**Python 知识点：**
- 用独立的 `getKthNode` 检查一组是否完整，返回 `None` 表示不足 `k` 个节点。
- `is not nextgroupstart` 比较的是对象身份，适合以某个节点引用作为链表区间边界。

## 随机链表的复制

**题目描述：** 链表每个节点包含 `next` 和 `random` 两个指针；`random` 可指向链表任意节点或空。请返回整条链表的深拷贝，新链表节点必须与原节点完全分离，同时保持相同的 `next`、`random` 关系。

**示例：** `[[7, null], [13, 0], [11, 4], [10, 2], [1, 0]]` 中每项为 `[节点值, random 指向的节点下标]`；复制结果的节点值和 `random` 关系应相同，但节点均为新节点。

**解题思路：**
1. 第一趟遍历为每个原节点创建副本，并建立“原节点到副本节点”的映射。
2. 第二趟遍历时，通过映射设置每个副本的 `next` 和 `random`。
3. 空头节点直接返回空；映射后的头节点即深拷贝链表的头。

### C++ 代码
```cpp
/*
// Definition for a Node.
class Node {
public:
    int val;
    Node* next;
    Node* random;
    
    Node(int _val) {
        val = _val;
        next = NULL;
        random = NULL;
    }
};
*/

class Solution {
public:
    Node* copyRandomList(Node* head) {
        //哈希表存放新旧节点的对应关系,先构建节点,再进行连接
        if(head==nullptr)return nullptr;
        Node* cur = head;
        unordered_map<Node*,Node*> um;
        Node* copy;
        while(cur){
            copy = new Node(cur->val);
            um[cur] = copy;
            cur = cur->next;
        }
        cur = head;
        while(cur){
            copy = um[cur];
            copy->next = um[cur->next];
            copy->random = um[cur->random];
            cur = cur->next;
        }
        return um[head];
    }
};
```
**C++ 知识点：**
- `unordered_map<Node*, Node*>` 以节点地址作为键，映射原节点和对应副本；不能用节点值作键，因为值可能重复。
- `um[cur->next]` 在空指针键处也会产生默认的空副本指针；代码依赖空指针映射为空。

### Python 代码
```python
"""
# Definition for a Node.
class Node:
    def __init__(self, x: int, next: 'Node' = None, random: 'Node' = None):
        self.val = int(x)
        self.next = next
        self.random = random
"""

class Solution:
    def copyRandomList(self, head: 'Optional[Node]') -> 'Optional[Node]':
        if head is None: return None
        hashtable = {}
        cur = head
        while cur:
            copy = Node(cur.val)
            hashtable[cur] = copy
            cur = cur.next
        cur = head
        while cur:
            copy = hashtable[cur]
            copy.next = hashtable.get(cur.next)
            copy.random = hashtable.get(cur.random)
            cur = cur.next
        return hashtable[head]
```
**Python 知识点：**
- 默认未重载相等与哈希的自定义节点对象可作为字典键，按对象身份区分不同节点。
- `dict.get(cur.random)` 在目标为空或键缺失时返回 `None`，可直接赋给副本的指针字段。

## 排序链表

**题目描述：** 给定单链表头节点 `head`，请按节点值升序排序并返回新头节点。要求时间复杂度为 O(n log n)，并尽量将额外空间控制在常数级（递归栈除外）。

**示例：** `head = [4, 2, 1, 3]`，输出 `[1, 2, 3, 4]`。

**解题思路：**
1. 使用归并排序：将链表切成小段，对有序链表段进行稳定合并。
2. 主实现采用自底向上的迭代版本：统计长度后，从段长 `1` 开始，每轮合并相邻两段，再将段长加倍。
3. 使用 `split` 断开指定长度的链表段，合并后接到本轮结果尾部，直到段长覆盖整条链表。

### C++ 代码
```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
    ListNode* merge(ListNode* left, ListNode* right){
        ListNode* p1 = left;
        ListNode* p2 = right;
        ListNode dummy = ListNode();
        ListNode* tail = &dummy;
        while(p1&&p2){
            if(p1->val<=p2->val){
                tail->next = p1;
                p1 = p1->next;
                tail = tail->next;
            }else{
                tail->next = p2;
                p2 = p2->next;
                tail = tail->next;
            }
        }
        tail->next = p1?p1:p2;
        return dummy.next;
    }
    ListNode* split(ListNode* head, int size){
        if(!head)return nullptr;
        ListNode* cur = head;
        //走到这一段的最后一个节点
        for(int i=1;i<size&&cur->next;++i){
            cur = cur->next;
        }
        ListNode* nxt = cur->next;
        cur->next = nullptr;
        return nxt;
    }
    ListNode* sortList1(ListNode* head) {
        if(!head||!head->next)return head;
        ListNode* fast = head;
        ListNode* slow = head;
        while(fast->next&&fast->next->next){//中间靠左
            fast = fast->next->next;
            slow = slow->next;
        }
        ListNode* right = slow->next;
        slow->next = nullptr;
        ListNode* left = sortList(head);
        right = sortList(right);
        return merge(left,right);
    }
    ListNode* sortList(ListNode* head) {
        if(!head||!head->next)return head;
        int n=0;
        ListNode* cur = head;
        while(cur){
            n++;cur=cur->next;
        }
        int size = 1;
        while(size<n){
            //cur是还未处理,left是处理的左半开头,right是处理的右半开头,split是切分指定长度片段,返回下一组的第一个
            cur = head;
            ListNode dummy(0);
            ListNode* tail = &dummy;
            while(cur){
                ListNode* left = cur;
                ListNode* right = split(left,size);
                cur = split(right,size);
                left = merge(left, right);
                tail->next = left;
                while(tail->next){
                    tail = tail->next;
                }
            }
            head = dummy.next;
            size *= 2;
        }
        return head;
    }
};
```
**C++ 知识点：**
- 迭代归并只重连链表指针，不需要为各段复制数组；`size *= 2` 按层扩大待合并区间。
- `sortList1` 是中点切分版本，但它调用 `sortList` 而非递归调用自身；题目提交入口 `sortList` 使用自底向上的迭代归并。

### Python 代码
```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def sortList1(self, head: Optional[ListNode]) -> Optional[ListNode]:
        def merge(left, right):
            '''
            合并左右排好序的部分
            '''
            p1 = left
            p2 = right
            dummy = ListNode()
            cur = dummy
            while p1 and p2:
                if p1.val<=p2.val:
                    cur.next = p1
                    p1 = p1.next
                    cur = cur.next
                else:
                    cur.next = p2
                    p2 = p2.next
                    cur = cur.next
            cur.next = p1 if p1 else p2

            return dummy.next
        '''
        # 递归,栈空间logn,迭代,空间1
        # 前者是找中点,断开,到底之后合并
        # 后者每次合并单元递增,i->2i
        '''

        if head is None or head.next is None: return head
        #找中点断开
        fast = slow = head
        while fast.next and fast.next.next:#中间偏左
            fast = fast.next.next
            slow = slow.next
        right = slow.next
        left = head
        slow.next = None
        #左右排好序
        left = self.sortList(left)
        right = self.sortList(right)

        return merge(left, right)

    def sortList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        '''
        迭代版本,避免递归栈的开销
        首轮前一个和后一个合并,第二轮前两个和后两个合并...
        自底向上
        '''
        def merge(left, right):
            '''
            合并左右排好序的部分
            '''
            p1 = left
            p2 = right
            dummy = ListNode()
            cur = dummy
            while p1 and p2:
                if p1.val<=p2.val:
                    cur.next = p1
                    p1 = p1.next
                    cur = cur.next
                else:
                    cur.next = p2
                    p2 = p2.next
                    cur = cur.next
            cur.next = p1 if p1 else p2

            return dummy.next
        def split(head, size):
            if not head: return head
            cur = head
            size -= 1
            while size and cur.next:
                cur = cur.next
                size -= 1
            nxt = cur.next
            cur.next = None
            return nxt
        
        if not head or not head.next: return head
        n = 0
        cur = head
        while(cur):
            n += 1
            cur = cur.next
        size = 1
        while size<n:
            dummy = ListNode()
            tail = dummy
            cur = head
            while cur:
                left = cur
                right = split(left, size)
                cur = split(right, size)
                left = merge(left,right)
                tail.next = left
                while tail.next:
                    tail = tail.next
            head = dummy.next
            size *= 2
        return head
```
**Python 知识点：**
- 主实现里的 `merge`、`split` 是嵌套函数，可直接访问外层方法局部作用域中的变量。
- `sortList1` 虽按中点拆分，但递归调用的是迭代版 `self.sortList`；提交入口 `sortList` 本身是自底向上的迭代归并。
- 本实现通过断开 `next` 来切分链表段，没有把链表转成列表或使用会复制元素引用的列表切片。

## 合并 K 个升序链表

**题目描述：** 给定由 `k` 条升序单链表组成的列表 `lists`，请将它们合并为一条升序链表并返回头节点。可以复用输入节点。

**示例：** `lists = [[1, 4, 5], [1, 3, 4], [2, 6]]`，输出 `[1, 1, 2, 3, 4, 4, 5, 6]`。

**解题思路：**
1. 把每条非空链表的头节点放入最小堆。
2. 每次取出全局最小节点接到结果尾部，再把该节点在原链表中的后继放入堆。
3. 堆为空时所有节点都已合并；每个节点最多入堆和出堆一次。

### C++ 代码
```cpp
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
    ListNode* mergeKLists(vector<ListNode*>& lists) {
        auto cmp = [](ListNode* a,ListNode* b){return a->val>b->val;};
        priority_queue<ListNode*,vector<ListNode*>,decltype(cmp)> pq;
        ListNode dummy(0);
        for(ListNode* list:lists){
            if(list){
                pq.push(list);
            }
        }

        ListNode* tail = &dummy;
        while(!pq.empty()){
            ListNode* tmp = pq.top();
            tail->next = tmp;
            pq.pop();
            if(tmp->next){
                pq.push(tmp->next);
            }
            tmp->next = nullptr;
            tail = tail->next;
        }
        return dummy.next;
    }
};
```
**C++ 知识点：**
- `priority_queue` 默认是最大堆；比较器返回 `a->val > b->val` 后，堆顶变为值最小的节点。
- `decltype(cmp)` 用 lambda 对象本身的类型作为 `priority_queue` 比较器类型。

### Python 代码
```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def mergeKLists(self, lists: list[ListNode | None]) -> ListNode | None:
        heap = []
        for i,lst in enumerate(lists):
            if lst:
                heapq.heappush(heap,(lst.val,i,lst))
        dummy = ListNode()
        tail = dummy
        while heap:
            _, i, cur = heapq.heappop(heap)
            tail.next = cur
            if cur.next:
                heapq.heappush(heap,(cur.next.val,i,cur.next))
            cur.next = None
            tail = tail.next

        return dummy.next
```
**Python 知识点：**
- `heapq` 是最小堆；元组 `(值, 链表编号, 节点)` 在值相同处用编号打破平局，避免继续比较不可排序的节点对象。
- `enumerate(lists)` 给每条链表稳定的编号，用作堆元组中的次级排序键。

## LRU 缓存

**题目描述：** 设计容量为 `capacity` 的 LRU 缓存，支持 `get(key)` 和 `put(key, value)`。命中 `get` 或写入键后，该键变为最近使用；容量满时新增键应淘汰最久未使用的键。未命中的 `get` 返回 `-1`。

**示例：** 容量为 `2`，执行 `put(1,1)`、`put(2,2)`、`get(1)`、`put(3,3)`、`get(2)`，两次查询结果依次为 `1`、`-1`。

**解题思路：**
1. 用哈希表按键 O(1) 查找节点，用带头尾哨兵的双向链表记录最近使用顺序。
2. 链表头部之后是最近使用项，尾部之前是最久未使用项；访问或更新已有项时先摘下，再移到头部。
3. 插入新项后若超出容量，就移除尾哨兵前的节点，并同步从哈希表删除其键。

### C++ 代码
```cpp
class dNode{
public:
    int key;
    int value;
    dNode* prev;
    dNode* next;
    dNode(int m_key=0, int m_value=0){
        key = m_key;
        value = m_value;
        prev = nullptr;
        next = nullptr;
    }
};

class LRUCache {
public:
    LRUCache(int capacity) {
        cap = capacity;
        head = new dNode();
        tail = new dNode();
        head->next = tail;
        tail->prev = head;
    }
    void remove(dNode* node){
        // 边界条件由外界控制,保证node一定是head和tail中间的节点
        node->prev->next = node->next;
        node->next->prev = node->prev;
    }
    void add_to_head(dNode* node){
        node->next = head->next;
        node->prev = head;
        head->next->prev = node;
        head->next = node;
    }
    int get(int key) {
        if(!um.contains(key)) return -1;
        dNode* node = um[key];
        remove(node);
        add_to_head(node);
        return node->value;
    }
    
    void put(int key, int value) {
        if(um.contains(key)){
            dNode* node = um[key];
            node->value = value;
            remove(node);
            add_to_head(node);
        }else{
            dNode* tmp = new dNode(key,value);
            add_to_head(tmp);
            um[key]=tmp;
            if(um.size()>cap){
                dNode* old = tail->prev;
                remove(old);
                um.erase(old->key);
                delete old;
            }
        }
    }
private:
    unordered_map<int, dNode*> um;
    int cap;
    dNode* head;
    dNode* tail;
};

/**
 * Your LRUCache object will be instantiated and called as such:
 * LRUCache* obj = new LRUCache(capacity);
 * int param_1 = obj->get(key);
 * obj->put(key,value);
 */
```
**C++ 知识点：**
- `unordered_map::contains` 需要 C++20；`um[key]` 用于已确认存在的键，再取得节点指针。
- 双向链表节点用裸指针手动连接；淘汰节点时同时从哈希表删除并 `delete`，避免该节点泄漏。

### Python 代码
```python
class dNode:
    def __init__(self, key=0, value=0):
        self.key = key
        self.value = value
        self.prev = None
        self.next = None

class LRUCache:

    def __init__(self, capacity: int):
        self.cap = capacity
        self.hashtable = {}
        self.head = dNode()
        self.tail = dNode()
        self.head.next = self.tail
        self.tail.prev = self.head
    
    def remove(self, node):
        # 外部控制node为head,tail之间的节点
        node.prev.next = node.next
        node.next.prev = node.prev
    
    def add_to_head(self, node):
        node.next = self.head.next
        node.prev = self.head
        self.head.next.prev = node
        self.head.next = node

    def get(self, key: int) -> int:
        if key in self.hashtable:
            node = self.hashtable[key]
            self.remove(node)
            self.add_to_head(node)
            return node.value
        return -1

    def put(self, key: int, value: int) -> None:
        if key in self.hashtable:
            node = self.hashtable[key]
            node.value = value
            self.remove(node)
            self.add_to_head(node)
        else:
            node = dNode(key, value)
            self.hashtable[key] = node
            self.add_to_head(node)
            if len(self.hashtable)>self.cap:
                old = self.tail.prev
                self.remove(old)
                self.hashtable.pop(old.key)



# Your LRUCache object will be instantiated and called as such:
# obj = LRUCache(capacity)
# param_1 = obj.get(key)
# obj.put(key,value)
```
**Python 知识点：**
- 字典把键映射到节点对象，双向链表负责顺序；两种结构保存的是同一批节点引用。
- `self.cap`、`self.hashtable` 等实例属性由 `self` 显式访问，辅助方法也通过 `self.remove(...)` 调用。

## 二叉树的中序遍历

**题目描述：** 给定二叉树根节点 `root`，请按左子树、根节点、右子树的顺序进行中序遍历，并返回访问到的节点值列表。

**示例：** 层序数组表示 `root = [1, null, 2, 3]`，输出 `[1, 3, 2]`。

**解题思路：**
1. 用栈模拟递归：沿左孩子一路入栈，直到当前节点为空。
2. 弹出栈顶节点并记录其值，再转向该节点的右子树。
3. 当当前节点为空且栈也为空时，遍历结束；Python 代码同时提供递归和迭代版本。

### C++ 代码
```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    vector<int> inorderTraversal(TreeNode* root) {
        //递归比较简单,这里用迭代
        stack<TreeNode*> st;
        TreeNode* cur = root;
        vector<int> ans;
        while(cur || !st.empty()){
            while(cur){
                st.push(cur);
                cur = cur->left;
            }

            TreeNode* node = st.top();
            ans.push_back(node->val);
            st.pop();

            cur = node->right;
        }
        return ans;
    }
};
```
**C++ 知识点：**
- `stack<TreeNode*>` 保存尚未访问的祖先节点；`top()` 读取栈顶，`pop()` 才真正移除它。
- 迭代版本不依赖系统递归栈，适合树高较大的输入。

### Python 代码
```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def inorderTraversal1(self, root: TreeNode | None) -> list[int]:
        def inorder(root):
            if not root: return 
            inorder(root.left)
            ans.append(root.val)
            inorder(root.right)
        ans = []
        inorder(root)
        return ans

    def inorderTraversal(self, root: TreeNode | None) -> list[int]:
        if not root: return []
        cur = root
        st = []
        ans = []
        while cur or st:
            while cur:
                st.append(cur)
                cur = cur.left
            
            node = st[-1]
            ans.append(node.val)
            st.pop()

            cur = node.right

        return ans
```
**Python 知识点：**
- Python 列表可作为栈：`append()` 入栈，读取 `st[-1]` 后用 `pop()` 移除栈顶。
- 代码中的 `inorderTraversal1` 是递归版本，主方法 `inorderTraversal` 使用显式列表栈。

## 二叉树的最大深度

**题目描述：** 给定二叉树根节点 `root`，返回从根节点到最远叶节点所经过的节点数。空树的最大深度为 `0`。

**示例：** `root = [3, 9, 20, null, null, 15, 7]`，输出 `3`。

**解题思路：**
1. 空节点深度为 `0`。
2. 递归求左子树和右子树的最大深度。
3. 当前节点的深度为两侧较大值加 `1`。

### C++ 代码
```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    int maxDepth(TreeNode* root) {
        if(root==nullptr) return 0;
        return std::max(maxDepth(root->left),maxDepth(root->right))+1;
    }
};
```
**C++ 知识点：**
- `root == nullptr` 是递归基，必须在访问 `root->left` 和 `root->right` 前处理。
- `std::max` 比较两个子树深度；独立运行时需包含 `<algorithm>`。

### Python 代码
```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def maxDepth(self, root: TreeNode | None) -> int:
        if not root: return 0
        return max(self.maxDepth(root.left),self.maxDepth(root.right))+1
```
**Python 知识点：**
- 递归调用同一个实例方法时写 `self.maxDepth(...)`，`self` 不会自动出现在显式参数列表里。
- 内置 `max(left, right)` 可直接比较两个整数深度。

## 翻转二叉树

**题目描述：** 给定二叉树根节点 `root`，交换每个节点的左右子树，返回翻转后的根节点。空树仍返回空。

**示例：** `root = [4, 2, 7, 1, 3, 6, 9]`，输出 `[4, 7, 2, 9, 6, 3, 1]`。

**解题思路：**
1. 空节点直接返回。
2. 递归翻转左右子树。
3. 将翻转后的右子树接到左侧、翻转后的左子树接到右侧，再返回当前节点。

### C++ 代码
```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    TreeNode* invertTree(TreeNode* root) {
        if(root==nullptr) return nullptr;
        TreeNode* left = invertTree(root->left);
        TreeNode* right = invertTree(root->right);
        root->left = right;root->right = left;
        return root;
    }
};
```
**C++ 知识点：**
- 递归函数返回 `TreeNode*`，保留的是原有节点指针；此题通过交换链接原地改树，不需新建节点。
- 先保存递归返回的左右指针，再重新赋给 `root->left`、`root->right`，避免覆盖尚未保存的子树。

### Python 代码
```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:
        if not root: return None
        left = self.invertTree(root.left)
        right = self.invertTree(root.right)
        root.left = right
        root.right = left
        return root
```
**Python 知识点：**
- Python 变量 `left`、`right` 保存子树根对象的引用；给节点字段赋值会原地改变树结构。
- 遇到空树返回 `None`，与 `Optional[TreeNode]` 类型相对应。

## 对称二叉树

**题目描述：** 给定二叉树根节点 `root`，判断这棵树是否沿根节点中心轴镜像对称。两侧对应节点的值和空缺位置都必须镜像匹配。

**示例：** `root = [1, 2, 2, 3, 4, 4, 3]`，输出 `true`。

**解题思路：**
1. 从根的左、右子树开始成对比较。
2. 一对节点都为空时匹配；仅一侧为空或节点值不同则不匹配。
3. 递归或成对入队比较外侧（左对右）和内侧（右对左）的子节点。空根节点应直接判为对称。

### C++ 代码
```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    bool isMirror(TreeNode* node1, TreeNode* node2){
        if(node1==nullptr && node2==nullptr){
            return true;
        }
        if(node1==nullptr || node2==nullptr){
            return false;
        }
        if(node1->val!=node2->val){
            return false;
        }
        return isMirror(node1->left,node2->right) && isMirror(node1->right,node2->left);
    }

    bool isSymmetric1(TreeNode* root) {
        return isMirror(root->left,root->right);
    }

    bool isSymmetric(TreeNode* root) {
        queue<pair<TreeNode*,TreeNode*>> q;
        q.push({root->left,root->right});
        while(!q.empty()){
            TreeNode* node1 = q.front().first;
            TreeNode* node2 = q.front().second;
            q.pop();
            if(node1==nullptr && node2==nullptr){
                continue;
            }
            if(node1==nullptr || node2==nullptr){
                return false;
            }
            if(node1->val!=node2->val){
                return false;
            }
            q.push({node1->left,node2->right});
            q.push({node1->right,node2->left});
        }
        return true;
    }
};
```
**C++ 知识点：**
- 队列中可以保存空节点指针，用来区分两侧形状；必须先判空，再访问 `node->val`。
- 当前 `isSymmetric` 直接读取 `root->left`，若要覆盖空根输入，需在入口先返回 `true`。

### Python 代码
```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def isSymmetric1(self, root: TreeNode | None) -> bool:
        q = deque()
        q.append((root.left, root.right))
        while q:
            node1, node2 = q.popleft()
            if not node1 and not node2:
                continue
            if not node1 or not node2:
                return False
            if node1.val != node2.val:
                return False
            q.append((node1.left,node2.right))
            q.append((node1.right,node2.left))
        return True
    
    def isSymmetric(self, root: TreeNode | None) -> bool:
        def isMirror(node1, node2):
            if not node1 and not node2:
                return True
            if not node1 or not node2:
                return False
            if node1.val != node2.val:
                return False
            return isMirror(node1.left,node2.right) and isMirror(node1.right,node2.left)
        return isMirror(root.left, root.right)
```
**Python 知识点：**
- 队列中的 `(node1, node2)` 元组可同时保存两个待比较引用；`deque.popleft()` 按广度优先取出。
- 当前入口会访问 `root.left`；空树用例需先判断 `root is None` 并返回 `True`。

## 二叉树的直径

**题目描述：** 给定二叉树根节点 `root`，返回树中任意两个节点之间最长简单路径的边数。路径不要求经过根节点；空树或单节点树的直径为 `0`。

**示例：** `root = [1, 2, 3, 4, 5]`，输出 `3`，最长路径为 `4 → 2 → 1 → 3`。

**解题思路：**
1. 后序递归求每个节点左右子树的高度，空树高度为 `0`。
2. 经过当前节点的路径长度是左高度加右高度，用它更新全局最大直径。
3. 向父节点只返回较高一侧的高度加一；路径长度按边数计，因此不额外加当前节点。

### C++ 代码
```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    int ans;
    int depth(TreeNode* root){
        if(root==nullptr) return 0;
        int left = depth(root->left);
        int right = depth(root->right);
        ans = std::max(left+right,ans);
        return std::max(left,right)+1;
    }
    int diameterOfBinaryTree(TreeNode* root) {
        ans = 0;
        depth(root);
        return ans;
    }
};
```
**C++ 知识点：**
- 类成员 `ans` 在 `diameterOfBinaryTree` 每次调用时重置，避免同一个 `Solution` 对象多次调用时残留旧答案。
- 递归先得到左右高度，再以 `left + right` 更新经过当前节点的边数。

### Python 代码
```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def diameterOfBinaryTree(self, root: Optional[TreeNode]) -> int:
        def depth(root):
            nonlocal ans
            if not root:
                return 0
            left = depth(root.left)
            right = depth(root.right)
            ans = max(ans,left+right)
            return max(left,right)+1
        ans = 0
        depth(root)
        return ans
```
**Python 知识点：**
- 嵌套函数要更新外层局部变量 `ans`，需声明 `nonlocal ans`；否则赋值会创建新的局部变量。
- 空节点高度返回 `0`，因此叶节点的左右高度和为 `0`，直径按边数计算正确。

## 二叉树的层序遍历

**题目描述：** 给定二叉树根节点 `root`，按从上到下、每层从左到右的顺序遍历，并将每一层的节点值分别放入一个列表返回。

**示例：** `root = [3, 9, 20, null, null, 15, 7]`，输出 `[[3], [9, 20], [15, 7]]`。

**解题思路：**
1. 把根节点放入先进先出队列。
2. 每轮开始时记录当前队列长度，该长度就是这一层的节点数。
3. 只处理这一批节点并把非空子节点追加到队尾，再将当前层结果加入答案。

### C++ 代码
```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    vector<vector<int>> levelOrder(TreeNode* root) {
        vector<vector<int>> ans;
        if(!root) return ans;
        queue<TreeNode*> qu;
        qu.push(root);
        while(!qu.empty()){
            vector<int> level;
            int level_size = qu.size();
            for(int i=0;i<level_size;++i){
                TreeNode* node = qu.front();
                qu.pop();
                level.push_back(node->val);
                if(node->left) qu.push(node->left);
                if(node->right) qu.push(node->right);
            }
            ans.push_back(level);
        }
        return ans;
    }
};
```
**C++ 知识点：**
- 先保存 `level_size = qu.size()`，避免处理本层时新入队的下一层节点也被本轮取出。
- `queue` 是先进先出容器，使用 `front()` 读取队首、`pop()` 移除队首。

### Python 代码
```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def levelOrder(self, root: TreeNode | None) -> list[list[int]]:
        ans = []
        if not root: return ans
        qu = deque()
        qu.append(root)
        while qu:
            level = []
            size = len(qu)
            for _ in range(size):
                node = qu.popleft()
                level.append(node.val)
                if node.left: qu.append(node.left)
                if node.right: qu.append(node.right)
            ans.append(level)
        return ans
```
**Python 知识点：**
- `deque.popleft()` 可在 O(1) 时间从队首出队；`list.pop(0)` 则需要移动后续元素。
- 先保存 `size = len(qu)` 再循环，确保每次只处理一层。

## 将有序数组转换为二叉搜索树

**题目描述：** 给定严格递增整数数组 `nums`，请构造一棵高度平衡的二叉搜索树并返回根节点。高度平衡指每个节点左右子树高度差不超过 `1`。

**示例：** `nums = [-10, -3, 0, 5, 9]`，可返回层序数组 `[0, -3, 9, -10, null, 5]` 所表示的树。

**解题思路：**
1. 对当前有序区间选择中间元素作为根节点。
2. 递归用中点左侧区间构造左子树，用右侧区间构造右子树。
3. 区间为空时返回空节点；每次取中点可使两侧规模尽量接近。

### C++ 代码
```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    TreeNode* sortedArrayToBST(const vector<int>& nums) {
        auto dfs = [&](auto&& self, int l, int r) -> TreeNode*{
            if(l>r) return nullptr;
            int mid = (l+r)/2;
            TreeNode* node = new TreeNode(nums[mid]);
            node->left = self(self, l, mid-1);
            node->right = self(self, mid+1, r);
            return node;
        };
        return dfs(dfs, 0, nums.size()-1);
    }
};
```
**C++ 知识点：**
- C++ 递归 lambda 通过通用参数 `self` 显式传递自身：`dfs(dfs, ...)`，这是 lambda 递归的一种常见写法。
- 使用左右下标而非复制子数组，递归额外开销主要是树高对应的调用栈。

### Python 代码
```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def sortedArrayToBST(self, nums: list[int]) -> TreeNode | None:
        if not nums: return None
        n = len(nums)
        mid = n//2
        node = TreeNode(nums[mid])
        node.left = self.sortedArrayToBST(nums[:mid])
        node.right = self.sortedArrayToBST(nums[mid+1:])
        return node
```
**Python 知识点：**
- `nums[:mid]` 和 `nums[mid + 1:]` 会各自创建新列表；代码简洁，但所有递归切片会产生额外复制开销。
- `n // 2` 取整数中点，空列表作为递归基返回 `None`。

## 验证二叉搜索树

**题目描述：** 给定二叉树根节点 `root`，判断它是否为有效二叉搜索树。每个节点左子树中的所有值都必须严格小于该节点，右子树中的所有值都必须严格大于该节点；重复值不合法。

**示例：** `root = [2, 1, 3]`，输出 `true`。

**解题思路：**
1. 利用二叉搜索树的中序遍历结果必须严格递增这一性质。
2. 迭代执行中序遍历，并保存刚访问过的前一个节点。
3. 若当前值小于或等于前一个值则返回 `false`；遍历完成说明整序列严格递增。

### C++ 代码
```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    bool isValidBST(TreeNode* root) {
        if(!root) return true;
        stack<TreeNode*> st;
        TreeNode* cur = root;
        TreeNode* pre = nullptr;
        while(cur || !st.empty()){
            while(cur){
                st.push(cur);
                cur = cur->left;
            }

            TreeNode* node = st.top();
            st.pop();
            if(pre!=nullptr&&node->val<=pre->val) return false;

            pre = node;
            cur = node->right;
        }
        return true;
    }
};
```
**C++ 知识点：**
- 只检查节点与直接左右孩子是不够的；中序遍历的前驱比较能验证整棵子树的约束。
- 条件使用 `node->val <= pre->val`，因此重复值会被拒绝。

### Python 代码
```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def isValidBST(self, root: TreeNode | None) -> bool:
        st = []
        cur = root
        pre = None
        while cur or st:
            while cur:
                st.append(cur)
                cur = cur.left
            node = st[-1]
            st.pop()
            if pre and pre.val>=node.val: return False

            pre = node
            cur = node.right
        return True
```
**Python 知识点：**
- `pre` 保存的是前一个节点对象；写成 `pre is not None` 比依赖对象真假更明确。
- 节点对象默认都为真，因此当前 `if pre` 可用，但它表达的是空值判断而非节点值判断。

## 二叉搜索树中第 K 小的元素

**题目描述：** 给定二叉搜索树根节点 `root` 和合法整数 `k`，返回树中按从小到大排序后的第 `k` 个节点值。

**示例：** `root = [3, 1, 4, null, 2]`，`k = 1`，输出 `1`。

**解题思路：**
1. 按中序顺序遍历二叉搜索树；访问顺序正好是节点值递增顺序。
2. 每访问一个节点就减少剩余名次（或增加已访问数）。
3. 第 `k` 个节点即为答案，可立即返回，无需遍历余下节点。

### C++ 代码
```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    int kthSmallest(TreeNode* root, int k) {
        stack<TreeNode*> st;
        TreeNode* cur = root;
        while(cur || !st.empty()){
            while(cur){
                st.push(cur);
                cur = cur->left;
            }
            TreeNode* node = st.top();
            st.pop();
            k--;
            if(k==0) return node->val;
            cur = node->right;
        }
        return 0;
    }
};
```
**C++ 知识点：**
- 迭代中序遍历在弹出节点时才计数；栈里的节点尚未按访问顺序输出。
- 题目保证 `k` 合法，因此函数末尾的兜底返回不会被执行。

### Python 代码
```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def kthSmallest(self, root: Optional[TreeNode], k: int) -> int:
        st = []
        cur_k = 0
        cur = root
        while cur or st:
            while cur:
                st.append(cur)
                cur = cur.left
            node = st[-1]
            st.pop()
            cur_k += 1
            if k==cur_k: return node.val

            cur = node.right
```
**Python 知识点：**
- `cur_k` 从 `0` 开始并在访问节点后加一，和题目从 `1` 开始计数的定义对应。
- `return` 可在找到第 `k` 个节点时提前结束遍历。

## 二叉树的右视图

**题目描述：** 给定二叉树根节点 `root`，从树的右侧观察时，每一层只能看到最右边的节点。请按从上到下的顺序返回这些可见节点的值。

**示例：** `root = [1, 2, 3, null, 5, null, 4]`，输出 `[1, 3, 4]`。

**解题思路：**
1. 按层序遍历逐层处理节点。
2. 每层开始时记录当前队列长度，只遍历这批节点。
3. 本层最后出队的节点就是右视图可见节点，将它的值加入结果。

### C++ 代码
```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    vector<int> rightSideView(TreeNode* root) {
         vector<int> ans;
         if(!root) return ans;
         queue<TreeNode*> qu;
         TreeNode* cur = root;
         qu.push(cur);
         while(!qu.empty()){
            int size = qu.size();
            for(int i=1;i<=size;++i){
                TreeNode* node = qu.front();
                qu.pop();
                if(node->left) qu.push(node->left);
                if(node->right) qu.push(node->right);
                if(i==size){
                    ans.push_back(node->val);
                }
            }
         }
         return ans;
    }
};
```
**C++ 知识点：**
- 本层下标从 `1` 到 `size`，因此最后一个节点满足 `i == size`。
- 每层处理前缓存队列长度，避免新加入的孩子被计入当前层。

### Python 代码
```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def rightSideView(self, root: Optional[TreeNode]) -> List[int]:
        ans = []
        qu = deque()
        if not root: return ans
        cur = root
        qu.append(cur)
        while qu:
            size = len(qu)
            for i in range(size):
                node = qu.popleft()
                if node.left: qu.append(node.left)
                if node.right: qu.append(node.right)
                if i==size-1: ans.append(node.val)
        return ans
```
**Python 知识点：**
- `range(size)` 产生 `0` 到 `size - 1`，所以最后一个下标是 `size - 1`。
- 通过 `deque.popleft()` 保持真正的 FIFO 层序；右视图不意味着要丢弃左孩子。

## 二叉树展开为链表

**题目描述：** 给定二叉树根节点 `root`，请原地将树展开为与前序遍历顺序一致的单链表。展开后所有左指针必须为空，右指针连接下一个节点。

**示例：** `root = [1, 2, 5, 3, 4, null, 6]`，展开后的右指针链为 `1 → 2 → 3 → 4 → 5 → 6`。

**解题思路：**
1. 用栈模拟前序遍历；由于栈后进先出，先压右子树，再压左子树。
2. 每次弹出一个节点，将其左指针设为空，并接到已处理链表尾部的右侧。
3. 沿处理顺序推进尾指针，最终所有节点按根、左、右顺序串接。

### C++ 代码
```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    void flatten(TreeNode* root) {
        if(!root) return;
        stack<TreeNode*> st;
        TreeNode dummy(0);
        TreeNode* tail = &dummy;
        TreeNode* cur = root;
        st.push(cur);
        while(!st.empty()){
            TreeNode* node = st.top();
            st.pop();
            if(node->right) st.push(node->right);
            if(node->left) st.push(node->left);
            node->left = nullptr;
            tail->right = node;
            tail = tail->right;
        }
    }
};
```
**C++ 知识点：**
- 节点入栈前先保存并压入原有右、左子树，之后才能覆盖节点的 `right` 链接。
- `TreeNode dummy` 是局部哑节点；结果仍由原树节点组成，函数无需返回哑节点。

### Python 代码
```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def flatten(self, root: TreeNode | None) -> None:
        st = []
        if not root: return 
        cur = root
        st.append(cur)
        dummy = TreeNode()
        tail = dummy
        while st:
            node = st[-1]
            st.pop()
            if node.right: st.append(node.right)
            if node.left: st.append(node.left)
            tail.right = node
            node.left = None
            tail = tail.right
        

```
**Python 知识点：**
- Python 列表可作栈，`append` 入栈、`pop` 取出末尾；先压右后压左才能先访问左子树。
- 函数按题目要求原地修改并返回 `None`，不是构造一份新树。

## 从前序与中序遍历序列构造二叉树

**题目描述：** 给定两个不含重复值的整数数组 `preorder` 和 `inorder`，分别表示同一棵二叉树的前序与中序遍历。请据此重建并返回该二叉树。

**示例：** `preorder = [3, 9, 20, 15, 7]`，`inorder = [9, 3, 15, 20, 7]`，构造出的树为 `[3, 9, 20, null, null, 15, 7]`。

**解题思路：**
1. 前序区间的第一个值是当前根；用哈希表查出该值在中序区间中的位置。
2. 中序根位置左侧的元素数就是左子树大小，可据此划分前序和中序的左右子区间。
3. 递归构造左右子树；任一区间为空时返回空节点。

### C++ 代码
```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    TreeNode* buildTree(vector<int>& preorder, vector<int>& inorder) {
        unordered_map<int,int> inorder_map;
        int n = inorder.size();
        for(int i=0;i<n;++i){
            inorder_map[inorder[i]]=i;
        }
        auto build = [&](auto&& self,int pl,int pr,int il,int ir)-> TreeNode*{
            if(pl>pr || il>ir) return nullptr;
            int val = preorder[pl];
            TreeNode* node = new TreeNode(val);
            int root_index = inorder_map[val];
            int left_size = root_index-il;
            node->left = self(self,pl+1,pl+left_size,il,root_index-1);
            node->right = self(self,pl+left_size+1,pr,root_index+1,ir);
            return node;
        };
        return build(build,0,n-1,0,n-1);
    }
};
```
**C++ 知识点：**
- `unordered_map<int, int>` 预存中序值到下标的映射，使查找根位置平均 O(1)。
- 递归 lambda 用 `self(self, ...)` 调用自身；传区间边界避免递归中复制子向量。

### Python 代码
```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def buildTree(self, preorder: list[int], inorder: list[int]) -> TreeNode | None:
        inorder_map = {val:i for i,val in enumerate(inorder)}
        def build(pl,pr,il,ir):
            if pl>pr or il>ir: return None
            val = preorder[pl]
            node = TreeNode(val)
            m = inorder_map[val]
            left_size = m-il
            node.left = build(pl+1,pl+left_size,il,m-1)
            node.right = build(pl+left_size+1,pr,m+1,ir)
            return node
        return build(0,len(preorder)-1,0,len(inorder)-1)
            
            
            
```
**Python 知识点：**
- 字典推导式 `{val: i for i, val in enumerate(inorder)}` 一次建立值到下标的映射。
- 递归函数通过闭包读取 `preorder` 和 `inorder_map`，只传递区间边界。

## 路径总和 III

**题目描述：** 给定二叉树根节点 `root` 和整数 `targetSum`，统计节点值之和等于目标值的向下路径数量。路径可从任意节点开始和结束，但只能沿父节点到子节点方向前进。

**示例：** `root = [10, 5, -3, 3, 2, null, 11, 3, -2, null, 1]`，`targetSum = 8`，输出 `3`。

**解题思路：**
1. DFS 时维护从根到当前节点的前缀和 `s`；若路径和为目标值，之前的前缀和应为 `s - targetSum`。
2. 哈希表记录当前递归路径上各前缀和出现的次数，先查询答案，再登记当前前缀和。
3. 递归完左右子树后撤销当前前缀和计数，确保兄弟分支不会互相影响；初始前缀和 `0` 记一次。

### C++ 代码
```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    int pathSum(TreeNode* root, int targetSum) {
        unordered_map<long long,int> um;
        um[0]=1;
        auto dfs = [&](auto&& self,TreeNode* node, long long s)->int{
            if(!node) return 0;
            s += node->val;
            int ans = um[s-targetSum];
            um[s]++;
            ans += self(self,node->left,s) + self(self,node->right,s);
            um[s]--;
            return ans;
        };
        return dfs(dfs,root,0);
    }
};
```
**C++ 知识点：**
- `um[s - targetSum]` 对不存在的前缀和会通过 `operator[]` 插入默认计数 `0`；`um[0] = 1` 用来覆盖从根开始的路径。
- 递归返回前执行 `um[s]--` 是回溯：映射必须只描述当前根到节点的路径。

### Python 代码
```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def pathSum(self, root: Optional[TreeNode], targetSum: int) -> int:
        prefix = {0:1}
        def dfs(node, s):
            if not node: return 0
            s += node.val
            ans = prefix.get(s-targetSum,0)
            prefix[s] = prefix.get(s,0) + 1
            ans += dfs(node.left,s) + dfs(node.right,s)
            prefix[s] -= 1
            return ans
        return dfs(root,0)

```
**Python 知识点：**
- `dict.get(key, 0)` 读取缺失前缀和时返回零，不会添加无关键。
- 嵌套 `dfs` 闭包可直接修改可变字典 `prefix`；修改字典内容不需要 `nonlocal`。

## 二叉树的最近公共祖先

**题目描述：** 给定二叉树根节点 `root` 和树中两个不同节点 `p`、`q`，返回它们最近公共祖先节点。最近公共祖先是同时以二者为后代（节点自身也可算后代）的最深节点；题目保证二者都存在。

**示例：** `root = [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4]`，`p = 5`，`q = 1`，输出值为 `3` 的节点。

**解题思路：**
1. 递归遇到空节点、`p` 或 `q` 时直接返回该节点。
2. 分别在左右子树查找；若左右递归都返回非空节点，当前根就是最近公共祖先。
3. 若只有一侧返回非空结果，就把该结果向上传递。

### C++ 代码
```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode(int x) : val(x), left(NULL), right(NULL) {}
 * };
 */
class Solution {
public:
    TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {
        if(!root || root==p || root==q) return root;
        TreeNode* left = lowestCommonAncestor(root->left,p,q);
        TreeNode* right = lowestCommonAncestor(root->right,p,q);
        if(left&&right) return root;
        return left?left:right;
    }
};
```
**C++ 知识点：**
- `root == p` 比较的是节点指针地址，题目给出的 `p`、`q` 本身是树中的节点引用。
- 返回 `left ? left : right` 可向上传递找到的目标节点或祖先，不需要额外标记。

### Python 代码
```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, x):
#         self.val = x
#         self.left = None
#         self.right = None

class Solution:
    def lowestCommonAncestor(self, root: 'TreeNode', p: 'TreeNode', q: 'TreeNode') -> 'TreeNode':
        if not root or root==p or root==q: return root

        left = self.lowestCommonAncestor(root.left,p,q)
        right = self.lowestCommonAncestor(root.right,p,q)

        if left and right: return root
        return left or right
```
**Python 知识点：**
- 普通 `TreeNode` 对象没有自定义相等方法时，`==` 默认按对象身份比较；`is` 更直接表达“同一节点”。
- `left or right` 可返回两侧中存在的节点对象，因为树节点对象默认是真值。

## 二叉树中的最大路径和

**题目描述：** 给定非空二叉树根节点 `root`，返回任意非空路径的最大节点值之和。路径沿父子边连接，可以从任意节点开始、在任意节点结束，但不能重复经过节点。

**示例：** `root = [-10, 9, 20, null, null, 15, 7]`，输出 `42`，对应路径 `15 → 20 → 7`。

**解题思路：**
1. 后序递归计算一个节点向下延伸时可提供给父节点的最大收益。
2. 负收益分支不参与路径，左右收益分别截断到至少 `0`。
3. 经过当前节点并连接左右两侧的路径用于更新全局答案；向父节点只能返回当前值加较大的一侧收益。

### C++ 代码
```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    int maxPathSum(TreeNode* root) {
        int ans = INT_MIN;
        auto dfs = [&](auto&& self,TreeNode* node)->int{
            if(!node) return 0;
            int left = std::max(self(self,node->left),0);
            int right = std::max(self(self,node->right),0);
            ans = std::max(ans,node->val+left+right);
            return node->val + std::max(left,right);//这里只返回一边,因为上去一个节点之后,如果下面是两边就重复
        };dfs(dfs,root);
        return ans;
    }
};
```
**C++ 知识点：**
- 全局答案初始化为 `INT_MIN`，确保全为负数时仍会选到一个非空路径。
- 递归返回值只能接一侧子树；左右两侧相加只用于以当前节点为最高点的全局候选路径。

### Python 代码
```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def maxPathSum(self, root: TreeNode | None) -> int:
        ans = float('-inf')
        def dfs(node):
            nonlocal ans
            if not node: return 0
            left = max(dfs(node.left),0)
            right = max(dfs(node.right),0)
            ans = max(ans,node.val+left+right)
            return node.val + max(left,right)
        dfs(root)
        return ans
```
**Python 知识点：**
- 嵌套 `dfs` 给外层变量赋值前声明 `nonlocal ans`。
- `float('-inf')` 可作负无穷初值；更新后的答案在整数节点值下会成为整数。

## 岛屿数量

**题目描述：** 给定只包含字符 '1'（陆地）和 '0'（水）的二维网格，统计岛屿数量。岛屿由上下左右相邻的陆地组成，网格边界之外不相连。

**示例：** `grid = [["1", "1", "0"], ["1", "0", "0"], ["0", "0", "1"]]`，输出 `2`。

**解题思路：**
1. 逐格扫描网格；每遇到一个尚未访问的陆地，就发现一座新岛屿并将计数加一。
2. 从该格开始用 BFS 或 DFS 遍历所有上下左右连通的陆地，并将它们标记为已访问。
3. 所有格子扫描完成后，返回启动过的搜索次数；C++ 直接把陆地改成水，Python 使用独立访问矩阵。

### C++ 代码
```cpp
class Solution {
public:
    int numIslands(vector<vector<char>>& grid) {
        if(grid.empty() || grid[0].empty()) return 0;
        int count = 0;
        vector<pair<int,int>> directions{{1,0},{-1,0},{0,1},{0,-1}};
        int m = grid.size();
        int n = grid[0].size();
        for(int i=0;i<m;++i){
            for(int j=0;j<n;++j){
                if(grid[i][j]=='0') continue;
                count++;
                queue<pair<int,int>> qu;
                qu.push({i,j});
                grid[i][j] = '0';
                while(!qu.empty()){
                    auto [row,col] = qu.front();
                    qu.pop();
                    for(auto& next:directions){
                        int next_row = row + next.first;
                        int next_col = col + next.second;
                        if(next_row>=0 && next_row<m && next_col>=0 && next_col<n && grid[next_row][next_col]=='1'){
                            qu.push({next_row,next_col});
                            grid[next_row][next_col]='0';
                        }
                    }
                }
            }
        }
        return count;
    }
};
```
**C++ 知识点：**
- `auto [row, col] = qu.front()` 是 C++17 结构化绑定；这里按值复制坐标对，之后再弹出队首。
- 搜索时把已入队陆地立即改成 '0'，防止同一格从多个方向重复入队；这会原地修改输入。

### Python 代码
```python
class Solution:
    def numIslands(self, grid: List[List[str]]) -> int:
        if not grid or not grid[0]: return 0
        direction = [(1,0),(-1,0),(0,1),(0,-1)]
        m, n = len(grid), len(grid[0])
        visited = [[False]*n for _ in range(m)]
        count = 0
        for i in range(m):
            for j in range(n):
                if visited[i][j] or grid[i][j]=='0':
                    continue
                count += 1
                visited[i][j] = True
                qu = deque([(i,j)])
                while qu:
                    row, col = qu.pop()
                    for d_r, d_c in direction:
                        next_row = row+d_r
                        next_col = col+d_c
                        if 0<=next_row<=m-1 and 0<=next_col<=n-1 and grid[next_row][next_col]=='1' and not visited[next_row][next_col]:
                            qu.append((next_row,next_col))
                            visited[next_row][next_col] = True
        return count
```
**Python 知识点：**
- 访问矩阵使用 `[[False] * n for _ in range(m)]`，确保每一行是独立列表。
- 变量名是 `deque`，但代码调用 `pop()` 从右侧取元素，实际执行的是 DFS 栈；换成 `popleft()` 才是 BFS。

## 腐烂的橘子

**题目描述：** 给定网格：`0` 表示空格、`1` 表示新鲜橘子、`2` 表示腐烂橘子。每分钟所有腐烂橘子会同时使上下左右相邻的新鲜橘子腐烂；返回全部腐烂所需的最少分钟数，若有橘子永远无法腐烂则返回 `-1`。

**示例：** `grid = [[2, 1, 1], [1, 1, 0], [0, 1, 1]]`，输出 `4`。

**解题思路：**
1. 先把所有初始腐烂橘子同时加入队列，并统计新鲜橘子数量。
2. 按队列当前层扩散：一层代表一分钟；新腐烂的橘子立即标记并加入下一层。
3. 每处理完一层增加分钟数；没有新鲜橘子时返回分钟数，队列耗尽仍有新鲜橘子则返回 `-1`。初始没有新鲜橘子时答案为 `0`。

### C++ 代码
```cpp
class Solution {
public:
    int orangesRotting(vector<vector<int>>& grid) {
        int m = grid.size();
        int n = grid[0].size();

        queue<pair<int, int>> q;
        int fresh = 0;

        for (int i = 0; i < m; ++i) {
            for (int j = 0; j < n; ++j) {
                if (grid[i][j] == 2) {
                    q.push({i, j});
                } else if (grid[i][j] == 1) {
                    ++fresh;
                }
            }
        }

        if (fresh == 0) return 0;

        vector<pair<int, int>> directions{{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        int minutes = 0;

        while (!q.empty() && fresh > 0) {
            int size = q.size();

            // 当前这一层同时腐烂
            for (int k = 0; k < size; ++k) {
                auto [r, c] = q.front();
                q.pop();

                for (auto& [dr, dc] : directions) {
                    int nr = r + dr;
                    int nc = c + dc;

                    if (nr >= 0 && nr < m && nc >= 0 && nc < n &&
                        grid[nr][nc] == 1) {
                        grid[nr][nc] = 2;
                        --fresh;
                        q.push({nr, nc});
                    }
                }
            }

            ++minutes;
        }

        return fresh == 0 ? minutes : -1;
    }
};
```
**C++ 知识点：**
- `int size = q.size()` 固定本轮层大小，确保同一分钟新加入的橘子不会在本轮继续传播。
- `auto& [dr, dc]` 通过结构化绑定引用方向对，避免复制，并保留原容器元素。

### Python 代码
```python
class Solution:
    def orangesRotting(self, grid: List[List[int]]) -> int:
        # 多源广度优先
        m, n = len(grid), len(grid[0])
        fresh = 0
        qu = deque()
        for i in range(m):
            for j in range(n):
                if grid[i][j]==1:
                    fresh += 1
                if grid[i][j]==2:
                    qu.append((i,j))
        if fresh==0: return 0
        minutes = 0
        directions = {(1,0),(-1,0),(0,-1),(0,1)}
        while qu and fresh:
            size = len(qu)
            for _ in range(size):
                r, c = qu.popleft()
                for delta_r,delta_c in directions:
                    nxt_r, nxt_c = r+delta_r, c+delta_c
                    if 0<=nxt_r<m and 0<=nxt_c<n and grid[nxt_r][nxt_c]==1:
                        qu.append((nxt_r,nxt_c))
                        grid[nxt_r][nxt_c] = 2
                        fresh -= 1
            minutes += 1
        return minutes if fresh==0 else -1
```
**Python 知识点：**
- `deque.popleft()` 按加入顺序逐层处理多个起点，构成多源 BFS。
- 方向集合的迭代顺序不固定，但四个方向只决定访问先后，不影响按层计算的最短分钟数。

## 课程表

**题目描述：** 有 `numCourses` 门课程，先修关系 `prerequisites[i] = [a, b]` 表示必须先完成课程 `b` 才能学习课程 `a`。请判断是否存在一种顺序完成所有课程；先修关系形成环时无法完成。

**示例：** `numCourses = 2`，`prerequisites = [[1, 0]]`，输出 `true`。

**解题思路：**
1. 把课程和先修关系建成有向图，并统计每个节点的入度。当前代码将边统一反向存为“课程指向其先修课”；整体反转图不改变是否存在环。
2. 把入度为 `0` 的课程加入队列，依次取出并移除其出边；相邻节点入度降到 `0` 时加入队列。
3. 统计处理节点数：若等于课程数则图无环，所有课程可完成；否则存在环。

### C++ 代码
```cpp
class Solution {
public:
    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {
        // 首先是构建出图,使用领接表(加上额外的每个节点入度统计),判断构建出来的图是不是DAG,使用的kahn算法
        vector<vector<int>> graph(numCourses,vector<int>());
        vector<int> indegree(numCourses,0);
        for(auto requi:prerequisites){
            graph[requi[0]].push_back(requi[1]);
            indegree[requi[1]]++;
        }

        queue<int> qu;
        int count = 0;
        for(int i=0;i<numCourses;++i){
            if(indegree[i]==0){
                qu.push(i);
            }
        }
        
        while(!qu.empty()){
            int cur_course = qu.front();
            qu.pop();
            count++;// 这个课程学完了,把后续的入度降低
            for(int i:graph[cur_course]){
                indegree[i]--;
                if(indegree[i]==0){
                    qu.push(i);
                }
            }
        }
        
        return count==numCourses;
    }
};
```
**C++ 知识点：**
- `vector<vector<int>> graph(numCourses)` 创建每门课各自的邻接表；`indegree` 用整数向量计数。
- 当前图的边方向与题目依赖方向相反，但整张图反向后环仍然存在或不存在，故用于环检测仍成立。

### Python 代码
```python
class Solution:
    def canFinish(self, numCourses: int, prerequisites: list[list[int]]) -> bool:
        edge = len(prerequisites)
        # 建图,领接表和每个节点的入度,领接表存放学完这个课程之后解锁的课程
        graph = [[] for _ in range(numCourses)]
        indegree = [0]*numCourses
        for u,v in prerequisites:
            graph[u].append(v)
            indegree[v] += 1
        # 将入度为零的加入队列中
        qu = deque()
        count = 0
        for i in range(numCourses):
            if indegree[i]==0:
                qu.append(i)
        # 遍历队列,出队列的时候就当做已学完
        while qu:
            cur = qu.popleft()
            count += 1
            for i in graph[cur]:
                indegree[i] -= 1
                if indegree[i]==0:
                    qu.append(i)
        return count==numCourses

```
**Python 知识点：**
- `for u, v in prerequisites` 用序列解包直接取出一条二元关系。
- `[[] for _ in range(numCourses)]` 为每门课创建独立邻接表，不能写成 `[[]] * numCourses`，否则各项会指向同一个列表。
