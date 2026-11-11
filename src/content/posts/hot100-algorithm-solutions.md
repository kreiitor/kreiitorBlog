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

这 53 道题覆盖哈希、双指针、滑动窗口、数组、矩阵、链表、二叉树和图。每道题给出解题思路、复杂度分析，以及 C++ 和 Python 实现。部分 C++ 实现使用 C++20；独立运行时需要按代码补充头文件或 Python 导入。

## 两数之和

### 题目描述

给定整数数组 `nums` 和目标值 `target`，找出数组中和等于目标值的两个元素，返回它们的下标。同一个元素不能使用两次；题目保证恰好有一组解，下标的返回顺序不限。

**示例：** `nums = [3, 3]`，`target = 6`，可返回 `[0, 1]`。虽然两个值相同，但它们来自不同位置。

### 思路

1. **记录已遍历元素：** 用哈希表保存“数值 → 下标”，初始为空。
2. **查找补数：** 从左到右遍历，当前数为 `num` 时，在表中寻找 `target - num`。找到了就返回补数和当前数的下标。
3. **登记当前元素：** 没找到补数时，记录当前数及下标，再继续遍历。先查后存可以避免把同一个元素使用两次；遍历结束仍未找到则返回空数组。

例如 `[2, 7, 11, 15]`，目标值为 `9`：看到 `2` 时记下下标 `0`，看到 `7` 时找到补数 `2`。C++ 返回 `[0, 1]`，Python 返回 `[1, 0]`；这两个下标都对应正确的元素。以下实现无解时返回空数组；题目通常保证存在解。

**复杂度：** 对长度为 n 的数组，哈希表操作平均为 O(1)，总时间平均 O(n)，额外空间 O(n)。哈希冲突严重时，不保证最坏情况仍为线性。

### C++ 实现

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

**代码经验：**

- `um[key]` 不只是查询：键不存在时会先插入默认值 `0`。本题先用 `contains` 确认补数存在，之后才读取其下标；不能用 `um[key]` 是否为零来判断存在性，因为有效下标也可能是 `0`。
- `unordered_map::contains` 需要 C++20；在 C++17 中可用 `find(key) != um.end()` 判断。花括号返回值会构造一个 `vector<int>`。
- `target - nums[i]` 使用 `int` 计算。如果把代码用于超出题目约束的数据，补数计算也可能溢出，应先用更宽的类型计算。

### Python 实现

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

**代码经验：**

- `target-num in hashtable` 检查的是键是否存在。不要写成根据 `hashtable.get(target-num)` 的真假判断：补数的下标可能是 `0`，而 `0` 在条件中为假。
- `hashtable[num] = i` 会覆盖相同数值的旧下标；本题返回任意一组解即可。`list[int]` 是 Python 3.9 起可用的内置泛型标注，标注本身不检查元素类型。

## 字母异位词分组

### 题目描述

给定字符串数组 `strs`，把互为字母异位词的字符串分到同一组，并返回所有分组。字母异位词是由相同字符按相同次数组成的字符串，字符顺序可以不同。输入字符串由小写英文字母组成，可以为空；分组及组内元素的返回顺序不限。

**示例：** 输入 `["ab", "ba", "zz"]`，可返回 `[["ab", "ba"], ["zz"]]`。

### 思路

1. **构造签名：** 对每个字符串生成能代表其字符组成的键。C++ 统计 26 个小写字母的次数；Python 将字符排序后转成字符串。
2. **放入分组：** 在哈希表中用签名查找对应分组，把原字符串追加进去。字母种类和次数相同的字符串会得到同一签名。
3. **收集结果：** 遍历哈希表的值，将各个分组放入结果。两种签名方式不同，但分组规则相同；组内及组之间的顺序不作为正确性条件。

C++ 的 `a - 'a'` 要求输入只包含小写英文字母；Python 的排序签名不依赖这个限制。

**复杂度：** 设有 n 个字符串，最大长度为 m。C++ 计数与构造签名的平均时间和空间为 O(n (m + 26 log (m + 2)))，空间包含结果中的字符串副本和签名。Python 排序签名的平均时间为 O(n m log (m + 2) + n)，存储结果和键使用 O(n (m + 1)) 空间；哈希表均按平均情况计。

### C++ 实现

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

**代码经验：**

- `um[s_ana]` 在签名首次出现时创建空向量，随后 `push_back(s)` 才能直接追加。计数签名同时写入字母和次数，避免只拼接数字造成边界歧义。
- `auto& [k, v]` 以引用取得哈希表中的键和值；`std::move(v)` 让结果向量接收该分组。移动后的 `v` 仍然有效，但内容不应假定不变或一定为空；本代码没有再使用它。结构化绑定需要 C++17。
- `unordered_map` 的遍历顺序没有保证，不能依赖不同分组的输出次序；`reserve(um.size())` 预留的是结果向量容量，不会改变分组数。

### Python 实现

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

**代码经验：**

- `sorted(s)` 返回列表，而列表不可哈希，不能直接用作字典键；原代码用 `str(...)` 将排序结果转为可哈希的字符串。其他实现也可用 `tuple(sorted(s))`。
- 新签名对应的 `[s]` 是新建列表，之后才向该列表追加。不要用 `dict.fromkeys(keys, [])` 给多个分组初始化同一个可变列表，否则向一组追加会影响其他组。

## 最长连续序列

### 题目描述

给定一个未排序的整数数组 `nums`，返回其中最长连续整数序列的长度。序列中的数字不要求在原数组中相邻，重复数字不增加长度；要求设计平均时间复杂度为线性的算法。

**示例：** 输入 `[9, 4, 2, 3, 8]`，返回 `3`，因为最长的连续序列是 `[2, 3, 4]`。

### 思路

1. **去重：** 将所有数放入哈希集合，便于判断一个整数是否出现过。
2. **寻找起点：** 遍历集合；如果 `num - 1` 已存在，就跳过 `num`，因为它不是连续序列的起点。
3. **向后扩展：** 从起点开始，只要下一个整数还在集合中就延长序列；每段结束后更新最长长度。没有元素时答案仍为 `0`。

例如 `[100, 4, 200, 1, 3, 2]` 中，只有 `1` 会开始扫描 `1, 2, 3, 4`；`2`、`3`、`4` 因为前驱存在而跳过。空数组返回 `0`。

**复杂度：** 哈希操作平均为 O(1) 时，每个数至多被作为序列成员扫描一次，平均时间 O(n)，额外空间 O(n)。集合不是有序容器，算法不依赖遍历顺序。

### C++ 实现

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

**代码经验：**

- `for (int num : nums_set)` 中的 `num` 是元素副本；循环内的 `num++` 只改变副本，不会修改集合或破坏遍历。
- `contains` 需要 C++20。输入包含 `INT_MIN` 或 `INT_MAX` 时，`num - 1` 或 `num + 1` 可能发生有符号整数溢出；扩大输入范围时需要先处理边界，不能依赖回绕。

### Python 实现

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

**代码经验：**

- `set(nums)` 会丢弃重复值；本题关心的是连续数值而不是出现次数，因此去重不影响答案。集合的遍历次序不保证数值有序，算法只依赖成员查找。
- 循环内的 `num += 1` 只是让局部变量指向下一个整数，不会修改正在遍历的集合。Python 整数不会因越过 32 位边界直接溢出。

## 移动零

### 题目描述

给定整数数组 `nums`，将其中所有 `0` 移到数组末尾，同时保持非零元素的相对顺序。要求直接修改原数组，不使用另一个数组保存结果。

**示例：** 输入 `[0, 4, 0, 2]`，原数组修改后为 `[4, 2, 0, 0]`。

### 思路

1. **定义位置：** `l` 是已经放好的最后一个非零元素的下标，初始为 `-1`；`r` 从左向右扫描。
2. **遇到非零值：** 先将 `l` 右移一格，再交换 `l` 和 `r` 处的元素，把当前非零值放到下一位置。
3. **遇到零并结束：** 零只需跳过。扫描完成后，非零元素保持原有相对顺序，剩余位置都是零。

例如 `[0, 1, 0, 3, 12]` 会原地变为 `[1, 3, 12, 0, 0]`。允许位置与自身交换，不需要额外分支。

**复杂度：** 扫描一次，时间 O(n)；只使用固定数量的变量，额外空间 O(1)。

### C++ 实现

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

**代码经验：**

- `l = -1` 是“尚未放入非零元素”的哨兵，不是可访问的数组下标。遇到非零值必须先执行 `l++`，再访问 `nums[l]`；C++ 向量下标越界是未定义行为。
- `vector<int>& nums` 使函数直接修改调用者的向量；这里返回类型是 `void`，结果在原向量里，而不是通过返回值取得。`l == r` 时三次赋值也可以安全地与自身交换。

### Python 实现

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

**代码经验：**

- 同样要先将 `l` 从 `-1` 加到 `0`。Python 的 `nums[-1]` 会访问末尾元素，忘记递增时不一定报错，可能悄悄交换错位置。
- `nums[r], nums[l] = nums[l], nums[r]` 先求右侧的值，再赋给左侧，适合原地交换；方法修改传入的列表并返回 `None`，不要把返回值当成结果列表。

## 盛水最多的容器

### 题目描述

给定非负整数数组 `height`，每个元素表示一条位于对应下标处的竖线高度。选择其中两条线，与横轴围成一个容器，返回它能容纳的最大水量。容器不能倾斜，数组中至少有两条线。

**示例：** 输入 `[1, 3, 2, 5]`，返回 `6`：下标 `1` 和 `3` 处的线间距为 `2`，较短的高度为 `3`。

### 思路

1. **初始化：** 左右指针分别放在数组两端，答案从 `0` 开始。
2. **计算面积：** 当前面积等于较短的柱子高度乘以两指针间距，并用它更新最大面积。
3. **移动短边：** 向内移动较短的一边，再计算新的候选面积，直到两指针相遇。两边等高时移动任意一边都可以；原代码移动左边。

移动的依据是：宽度只会变小，如果保留短边而移动长边，新容器高度仍不超过这条短边，不可能改善刚才的面积；换掉短边才有机会找到更高的限制高度。

**复杂度：** 时间 O(n)，额外空间 O(1)。面积使用题目要求的 `int` 返回；使用其他数据范围时应检查乘法和结果是否溢出。

### C++ 实现

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

**代码经验：**

- `height.size()` 是无符号类型：空向量时先计算 `height.size() - 1` 会发生无符号下溢，之后再转为 `int` 也不能作为通用的边界处理。本题原代码依赖至少两条线的题目约束；复用时应先检查长度。
- 局部变量 `max` 会遮蔽同名的未限定函数名；要调用标准库函数可以写 `std::max`。这里 `minHeight` 实际没有被调用，而且其中的加减法及 `abs` 在极端整数范围下可能溢出。

### Python 实现

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

**代码经验：**

- 变量名 `max_` 避开了内置函数 `max`。若把变量命名为 `max`，后面的 `max(max_, area)` 可能因内置函数被遮蔽而报错。
- Python 的 `len(height) - 1` 在空列表时为 `-1`；本代码先检查 `l < r`，因此不会访问下标。不过题目仍要求至少两条线，复用时应明确自己的输入约定。

## 三数之和

### 题目描述

给定整数数组 `nums`，找出所有和为 `0` 的三元组。每个三元组必须来自三个不同的下标；结果中不能包含数值相同、仅顺序不同的重复三元组，输出顺序不限。

**示例：** 输入 `[-2, 0, 1, 1, 2]`，可返回 `[[-2, 0, 2], [-2, 1, 1]]`。

### 思路

1. **排序并固定第一个数：** 对数组原地排序，依次选取 `nums[i]`；相同的固定值只处理一次。
2. **根据边界剪枝：** 固定值已经大于零，或它与最小两个候选值之和大于零时，结束外层循环；它与最大两个候选值之和仍小于零时，跳过当前固定值。
3. **双指针搜索：** 在 `i` 右侧设置左右指针。三数和偏小则左指针右移，偏大则右指针左移；等于零时记录三元组。
4. **去重并继续：** 指针移动后跳过相同值，避免重复记录，直到左右指针相遇；再处理下一个固定值。

**复杂度：** 排序后外层最多 n 次，每次双指针线性扫描，时间 O(n<sup>2</sup>)。不计结果，C++ 排序的辅助空间依实现而异，常见实现为 O(log n)；Python 的原地排序可能使用 O(n) 临时空间。结果所需空间另计。

### C++ 实现

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

**代码经验：**

- `sort(nums.begin(), nums.end())` 来自 `<algorithm>`，会原地修改通过引用传入的向量；需要保留原顺序时，应在调用该实现前准备副本。
- `l < r && nums[l] == nums[l-1]` 利用从左到右的短路求值先检查边界，指针相遇后不会再读取后半条件。原代码用 `int` 求和与取负，复用到更大范围时要检查溢出。

### Python 实现

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

**代码经验：**

- `nums.sort()` 原地修改列表，而且返回 `None`；不要写成 `nums = nums.sort()`。需要保留原列表时，可以在调用该实现前传入副本。
- 原代码的去重条件先读取 `nums[l]` 或 `nums[r]`，再判断指针位置。当前指针移动方式仍使这些读取位于有效下标内；但改写循环时更稳妥的习惯是先检查边界，再用 `and` 短路保护索引。
- `range(n - 2)` 在元素不足三个时为空，因此外层循环不会访问 `i+1` 或 `i+2`。

## 接雨水

### 题目描述

给定非负整数数组 `height`，其中每个数表示一根宽度为 `1` 的柱子的高度。下雨后，相邻柱子之间可能积水；返回这些柱子总共能接住多少单位的水。

**示例：** 输入 `[3, 0, 2, 0, 4]`，返回 `7`：三个低处分别积水 `3`、`1`、`3` 个单位。

### 思路

1. **初始化：** 指针从两端出发，`l_m`、`r_m` 分别记录已处理的左侧和右侧最高柱，答案从 `0` 开始。
2. **选择处理侧：** 比较当前左右柱子的高度，处理较低的一侧；相等时处理左侧。
3. **更新并累加：** 先用当前柱子更新该侧最高值，再将“该侧最高值减去当前柱高”加入答案，然后向中间移动该侧指针。另一侧同理。
4. **结束：** 指针交错后，每个位置都已处理，返回累计水量。

为什么可以处理较低的一侧？例如当前左柱不高于右柱时，右柱已提供边界；如果左侧历史最高柱更高，之前右侧也必然遇到过足够高的边界，否则右指针会先被处理。因此当前左侧的水量可以确定为 `l_m - height[l]`。

**复杂度：** 每个位置处理一次，时间 O(n)，额外空间 O(1)。空数组时循环不执行，结果为 `0`。结果使用题目范围内的 `int`；更大输入需检查累计值是否溢出。

### C++ 实现

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

**代码经验：**

- 先更新 `l_m` 或 `r_m`，再做差并累加；如果反过来处理一个新的最高柱，可能错误地算出负水量。初始化为 `0` 依赖柱高非负的题目约束。
- 这里先将长度保存到 `int n`，再计算 `r = n - 1`；空数组时 `r` 为 `-1`，循环不会访问数组。与上一题直接用无符号 `size() - 1` 的写法不同；超大容器仍需考虑长度转为 `int` 的范围。

### Python 实现

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

**代码经验：**

- `while l <= r` 同时保证空数组不会访问 `height[-1]`，也让两指针相遇时的位置被处理一次。Python 的负下标在非空列表中可能合法，因此不能指望越界异常代替指针边界判断。
- 先更新本侧最高值，再计算差值；左右两侧分别维护状态，不能把右侧最高值误用于左侧计算。

## 无重复字符的最长子串

### 题目描述

给定字符串 `s`，找出其中不含重复字符的最长连续子串，返回其长度。子串要求字符在原字符串中连续；空字符串的答案为 `0`。

**示例：** 输入 `"aabcbc"`，返回 `3`，例如子串 `"abc"` 没有重复字符。

### 思路

1. **记录状态：** 用 `l`、`r` 表示窗口两端，哈希表保存每个字符最近出现的下标。
2. **检查重复：** 右端加入字符时，如果该字符上次出现的位置仍在当前窗口内，把 `l` 移到旧位置的下一格；否则不移动左端。
3. **更新答案：** 记录字符的新下标，用当前窗口长度 `r-l+1` 更新最长长度，再继续移动右端。

例如 `abba`：处理第二个 `b` 后，左端移到下标 `2`。接着看到 `a` 时，它上次的位置为 `0`，已经在窗口之外，因此不能让左端倒退。这就是原代码中 `seen[...] >= l` 判断的作用。

**复杂度：** 对长度为 n 的输入，哈希操作按平均情况计算，时间为 O(n)；哈希表保存整个输入中出现过的字符，下标表占 O(d) 空间，其中 d 是不同字符数。C++ 参数 `string s` 按值传入，额外的字符串副本可能占 O(n) 空间。

### C++ 实现

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

**代码经验：**

- `contains` 为假时，`&&` 会跳过后面的 `seen[s[r]]`；这也避免用 `operator[]` 查询不存在的键时意外插入默认下标。`contains` 需要 C++20。
- `seen[s[r]] >= l` 不能省略：上次位置已经离开窗口时，直接用它更新 `l` 可能让左边界倒退。
- `std::string` 按字节索引：UTF-8 中文通常占多个字节，不能把这里的窗口长度当成汉字数或用户看到的字符数。ASCII 输入不受此区别影响。

### Python 实现

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

**代码经验：**

- `ch in seen and seen[ch] >= l` 先判键存在再读下标；`and` 短路可避免对不存在的键触发 `KeyError`，后半条件则防止窗口左端倒退。
- Python 字符串按 Unicode 码点索引，与 C++ `std::string` 的字节索引不同；但一个用户感知的字符也可能由多个码点组成，不能一概把码点数当作显示字符数。

## 找到字符串中所有字母的异位词

### 题目描述

给定两个只含小写英文字母的字符串 `s` 和非空字符串 `p`，找出 `s` 中所有与 `p` 互为字母异位词的连续子串，返回这些子串的起始下标。异位词的每种字母出现次数必须相同。

**示例：** `s = "baaab"`，`p = "aab"`，返回 `[0, 2]`，对应子串 `"baa"` 和 `"aab"`。

### 思路

1. **检查长度：** 如果 `s` 比 `p` 短，不可能存在符合条件的窗口，直接返回空结果。
2. **建立计数：** 用两个长度为 26 的数组，分别统计 `p` 和 `s` 的第一个等长窗口中的字母次数；计数相等时记录起点 `0`。
3. **滑动窗口：** 每次加入右侧新字符，同时移除左侧旧字符，使窗口长度保持不变。
4. **判断匹配：** 窗口和模式串的计数相等时，记录当前窗口起点；直到窗口到达 `s` 的末尾。

例如 `s = "cbaebabacd"`、`p = "abc"`：起点 `0` 的 `cba` 和起点 `6` 的 `bac` 都与 `abc` 具有相同的字母计数。实现按小写英文字母建立 26 个槽位，要求输入属于该字符范围，且按题目约束 `p` 非空。

**复杂度：** 设 n、m 分别为 `s`、`p` 的长度。构建计数及滑动窗口需要 O(n + m) 时间；每次比较 26 个槽位属于常数开销。计数数组占 O(1) 辅助空间，结果另计；C++ 代码按值传入两个字符串，还可能产生 O(n + m) 的参数副本。

### C++ 实现

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

**代码经验：**

- 原生 C++ 数组的 `==` 不会逐项比较元素；原代码用 `<algorithm>` 中的 `std::equal`。原生数组没有 `.begin()`，可以使用 `<iterator>` 中的 `std::begin` 和 `std::end`。
- 这里的三迭代器版本只给第二个数组的起点，要求第二个范围至少有 26 个元素。改用 `std::array` 或 `std::vector` 时，可以直接用 `==` 比较元素。
- `ch - 'a'` 作为下标依赖小写字母约束；其他字符可能造成下标越界。

### Python 实现

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

**代码经验：**

- 列表的 `==` 逐项比较内容，适合比较两个计数列表；`is` 比较的是对象身份，不能替代本题的内容比较。
- `[0] * 26` 用于整数计数没有共享修改的问题，因为整数不可变；但 `[[0] * 26] * n` 会让多行指向同一个内层列表，修改一行可能影响其他行。
- `ord(ch) - ord('a')` 依赖小写字母约束。负数在 Python 中可能成为合法的负下标而不是报错，输入不符合约束时可能悄悄统计到错误的位置。

## 和为 K 的子数组

### 题目描述

给定整数数组 `nums` 和整数 `k`，统计其中元素之和等于 `k` 的非空连续子数组的个数。数组可以包含负数和零；位置不同的子数组分别计数。

**示例：** `nums = [1, -1, 1]`，`k = 1`，返回 `3`，对应下标区间 `[0, 0]`、`[0, 2]` 和 `[2, 2]`。

### 思路

1. **初始化：** `prefix` 是当前前缀和，哈希表记录此前各前缀和出现的次数。先将空前缀 `0` 记为出现一次，答案初始化为 `0`。
2. **更新前缀和：** 从左到右加入当前元素，得到截至当前位置的 `prefix`。
3. **查找满足条件的起点：** 要使两次前缀和之差为 `k`，较早的前缀和必须是 `prefix-k`；把它此前出现的次数加入答案。
4. **登记当前前缀：** 查询完成后，才将当前 `prefix` 的次数加一，然后继续处理下一个元素。

先查询、后登记可避免 `k = 0` 时把空子数组算进去；初始化空前缀则让从数组开头开始的子数组也能被统计。该方法同样适用于包含负数的数组。

**复杂度：** 长度为 n 的数组会遍历一次，哈希操作按平均情况计算，时间为 O(n)，最多保存 O(n) 个不同前缀和。

### C++ 实现

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

**代码经验：**

- `um[prefix]++` 对不存在的键先插入值为 `0` 的条目，再递增，适合累计次数。查询时的 `contains` 不会插入键；它需要 C++20。
- 必须先查询 `prefix-k` 再登记当前前缀；特别是 `k = 0` 时，顺序颠倒会把当前前缀自身算作一个空子数组。
- `prefix`、`prefix-k` 和答案均使用 `int`。若数据范围扩大，前缀和或子数组数量可能溢出，应评估并一致地使用更宽的类型。

### Python 实现

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

**代码经验：**

- `hashtable.get(key, 0)` 只返回缺省值，不会把缺失键插入字典；计数要靠后面的 `hashtable[prefix] = ...` 写回。和 C++ `unordered_map::operator[]` 的行为不同。
- 空前缀必须有一次计数，查询也必须在登记当前前缀之前，否则会漏掉从下标 `0` 开始的答案或多算空子数组。
- 原代码使用 `typing.List`，但没有包含导入；独立运行时应在另一个副本中补充。Python 整数可以自动扩展精度，不受固定宽度 `int` 的同样限制。

## 滑动窗口最大值

### 题目描述

给定整数数组 `nums` 和窗口长度 `k`。一个长度为 `k` 的窗口从数组左端开始，每次向右移动一格；按窗口出现的顺序返回每个窗口中的最大值。输入满足 `1 <= k <= len(nums)`。

**示例：** `nums = [4, 1, 3, 2, 5]`，`k = 3`，返回 `[4, 3, 5]`。

### 思路

1. **维护候选：** 双端队列保存下标，其对应数值从队头到队尾单调不增。加入新下标前，从队尾移除所有比新值小的下标；相等值按原代码保留。
2. **建立首个窗口：** 依次加入前 `k` 个下标，队头即第一个窗口的最大值下标，记录其数值。
3. **窗口右移：** 先从队头移除已越过左边界的下标，再按单调规则加入新的右端下标。
4. **记录最大值：** 每次移动后，队头都指向当前窗口的最大值，记录它直到扫描结束。

移除较小候选的依据是：新元素更晚离开窗口，而旧元素更小，因此只要新元素仍在窗口，旧元素就不可能成为最大值。代码依赖题目约束 1 <= k <= n。

**复杂度：** 每个下标最多入队一次、出队一次，均摊时间为 O(n)；队列最多保存 O(k) 个下标，结果另占 O(n-k+1) 空间。

### C++ 实现

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

**代码经验：**

- 空 `deque` 不能读取或删除元素；代码用 `!dq.empty()` 保护队尾访问，并在入队后读取最大值。
- 窗口每次右移一格，只需一个 `if` 移除过期队头；跳过多个位置时应重新检查这个前提。
- `>` 保留相等值。原代码要求 `1 <= k <= n`，但 `n < k` 没检查 `k <= 0`。

### Python 实现

```python
class Solution:
    def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:
        # 一个数组,存放下标,表示当前窗口下可能的最大值,最左侧是当前最大值
        # 当新来的比最右侧的大,删除最右侧(只到新来的比最右侧大就重复)
        # 当新来的比最右侧的小,加入最右侧
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

**代码经验：**

- `while qu and ...` 先判空，避免访问空队列时报 `IndexError`。队首用 `popleft()` 删除，不像列表 `pop(0)` 那样需要移动后续元素。
- `>` 保留相等值，`k <= 0` 不满足原代码前提。独立运行需在副本中导入 `collections.deque` 和 `typing.List`，它们不是内置名称。

## 最小覆盖子串

### 题目描述

给定字符串 `s` 和非空字符串 `t`，找出 `s` 中包含 `t` 所有字符及其出现次数的最短连续子串；不存在时返回空字符串。例如 `s = "ADOBECODEBANC"`、`t = "ABC"`，结果为 `"BANC"`。

### 思路

1. 用 `needs` 记录每种字符还缺多少个，`kinds` 记录目标字符种类数。
2. 右端加入字符时减少其欠缺量；某字符欠缺量恰好变为零时，`getk` 加一。
3. 当 `getk == kinds`，窗口已满足要求。记录更短的窗口，并移动左端尝试收缩，直到某种目标字符重新不足。

超额字符的欠缺量为负数，不属于 `t` 的字符也可出现负计数；移除它们不会错误地减少 `getk`。代码依赖 `t` 非空。

**复杂度：** 两端各最多移动一次，平均时间 O(n+m)，哈希表空间为 O(d)，其中 d 是两个字符串中出现的不同字符数；C++ 参数按值传入还会产生字符串副本。

### C++ 实现

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

**代码经验：** `needs[s[r]]` 对未出现的字符会插入初始值零；`substr` 的第二个参数是长度，故闭区间长度为 `r_ans-l_ans+1`。`std::string` 按字节处理字符。

### Python 实现

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
                # 尝试缩短窗口
                needs[s[l]] += 1
                if needs[s[l]]>0:
                    getk -= 1
                l += 1
                
        return "" if l_ans==-1 else s[l_ans:r_ans+1]

```

**代码经验：** `defaultdict(int)` 允许直接减少不存在字符的计数，独立运行时需导入 `collections.defaultdict`；切片右端不包含，因此使用 `r_ans+1`。

## 最大子数组和

### 题目描述

给定非空整数数组，返回非空连续子数组的最大和。例如 `[-2, 1, -3, 4, -1, 2, 1, -5, 4]` 的答案为 `6`，对应 `[4, -1, 2, 1]`。

### 思路

1. C++ 维护以当前位置结尾的最大和 `temp`：此前的和不大于零时从当前元素重新开始，否则继续累加。
2. Python 的 `maxSubArray` 使用分治：答案位于左半、右半或跨越中点；跨中点时分别求左侧最大后缀和右侧最大前缀。
3. Python 还保留了线性动态规划版本 `maxSubArray1`，每一步在重新开始与接续前一段之间取较大值。

**复杂度：** C++ 及 Python 线性版本时间 O(n)，辅助空间分别为 O(1) 和 O(n)（后者的 `nums[1:]` 创建切片）；Python 分治版本时间 O(n log n)，递归栈 O(log n)。

### C++ 实现

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

**代码经验：** `INT_MIN` 使全负数组也能得到正确答案；若扩大数值范围，累加的 `int` 可能溢出。

### Python 实现

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

**代码经验：** 平台调用的是 `maxSubArray`，而不是 `maxSubArray1`；分治函数需要非空输入，两个分支中的 `cross` 分别向左右扫描。

## 合并区间

### 题目描述

给定若干闭区间，合并所有重叠区间。例如 `[[1,3],[2,6],[8,10]]` 合并为 `[[1,6],[8,10]]`；端点相等也算重叠。

### 思路

1. 按左端点升序原地排序，依次处理每个区间。
2. 如果结果为空，或结果最后一个区间的右端小于当前左端，追加新区间；否则用两个右端点的较大值更新最后一个区间。

**复杂度：** 排序时间 O(n log n)，扫描 O(n)，结果空间 O(n)；排序的额外空间由语言和实现决定。

### C++ 实现

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

**代码经验：** `sort` 修改输入顺序；`push_back(interval)` 将区间复制到结果中，`reserve` 只预留容量。

### Python 实现

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

**代码经验：** `sort` 原地排序，`res.append(interval)` 保存的是原内层列表的引用，合并时修改 `res[-1][1]` 也可能改变输入中的相应区间。

## 轮转数组

### 题目描述

给定非空数组 `nums` 和非负整数 `k`，将数组原地向右轮转 `k` 个位置。例如 `[1,2,3,4,5,6,7]` 右移 `3` 位得到 `[5,6,7,1,2,3,4]`。

### 思路

1. 先用 `k %= n` 去掉完整轮转。
2. 主方法 `rotate` 按 `nxt = (cur+k)%n` 环状搬运元素，用 `prev` 保存待放入的值；某一环回到起点后，再从下一个起点继续，直到移动了 `n` 个元素。
3. 另一方法 `rotate1` 依次反转整个数组、前 `k` 个元素和其余元素，也能得到右移结果。

**复杂度：** 两种方法均为 O(n) 时间、O(1) 额外空间。

### C++ 实现

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

**代码经验：** `count` 跨各个环累计，不能只处理从零出发的一个环；两个方法均依赖 `n > 0`，否则 `k %= n` 无效。

### Python 实现

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

**代码经验：** `nums[nxt], prev = prev, nums[nxt]` 同时完成交换；`rotate1` 的内层函数修改外部列表，但不重新绑定 `nums`。

## 除了自身以外数组的乘积

### 题目描述

返回数组，其中第 `i` 项是输入中除 `nums[i]` 外所有元素的乘积，不能使用除法。例如 `[1,2,3,4]` 返回 `[24,12,8,6]`。

### 思路

1. 从左到右将每个位置左侧所有数的乘积存入 `ans`，第一个位置的空乘积为 `1`。
2. 从右到左用 `subfix` 维护当前位置右侧的乘积，先乘到 `ans[i]`，再把当前元素纳入后缀乘积。

**复杂度：** 时间 O(n)；不计输出数组，额外空间 O(1)。

### C++ 实现

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

**代码经验：** 先更新答案再乘入当前数，才能排除自身。`int` 中间乘积仍应受数据范围约束，扩大范围时需评估溢出。

### Python 实现

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

**代码经验：** 逆序的 `range(n-1,-1,-1)` 包含下标零；独立运行时需要导入 `typing.List`。

## 缺失的第一个正数

### 题目描述

给定未排序整数数组，找出没有出现的最小正整数，要求线性时间、常数额外空间。例如 `[3,4,-1,1]` 的答案为 `2`。

### 思路

1. 长度为 `n` 的数组，答案只可能在 `1` 到 `n+1` 之间。
2. 将每个处于 `1..n` 的值 `x` 交换到下标 `x-1`，直到当前位置无可移动值，或目标位置已有相同值。
3. 再扫描第一个没有放对数字的位置，返回其下标加一；全部放对则返回 `n+1`。

**复杂度：** 每次有效交换至少将一个值放到目标位置，主方法时间 O(n)、额外空间 O(1)。C++ 中还保留排序方法 `firstMissingPositive1`，其排序时间为 O(n log n)。

### C++ 实现

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

**代码经验：** 先判断值在 `1..n` 内，才能访问对应下标；重复值必须跳过，否则交换会循环。最终比较先转为 `long long` 再减一，避免对极小整数直接减一溢出。

### Python 实现

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

**代码经验：** `and` 短路保证不使用不合法的目标下标；算法会原地改变输入数组。

## 矩阵置零

### 题目描述

给定非空矩阵，如果某元素为零，则将它所在的整行和整列置零，要求原地修改。例如 `[[1,1,1],[1,0,1],[1,1,1]]` 变为 `[[1,0,1],[0,0,0],[1,0,1]]`。

### 思路

1. 先分别记录原首行、首列是否含零。
2. 用首列和首行记录内部零所在的行与列；再依据标记置零内部元素。
3. 最后根据之前保存的两个标志处理首行和首列，避免提前破坏标记。

**复杂度：** 主方法时间 O(m n)、额外空间 O(1)。Python 的 `setZeroes1` 使用独立行列标记，额外空间 O(m+n)。

### C++ 实现

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

**代码经验：** 首行和首列共用左上角，因此需要两个独立标志；代码访问 `matrix[0]`，要求矩阵非空。

### Python 实现

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

**代码经验：** `not matrix[i][j]` 在本题整数输入中表示值为零；`setZeroes1` 是另一个实现，平台调用的是 `setZeroes`。

## 螺旋矩阵

### 题目描述

按顺时针螺旋顺序返回非空矩阵所有元素。例如 `[[1,2,3],[4,5,6],[7,8,9]]` 返回 `[1,2,3,6,9,8,7,4,5]`。

### 思路

1. 用 `left`、`right`、`top`、`bottom` 表示未访问区域。
2. 依次走上边、右边、下边、左边，每走完一边就收缩对应边界。
3. 在走下边和左边前确认区域仍存在，避免单行或单列时重复访问。

**复杂度：** 每个元素访问一次，时间 O(m n)；不计返回结果，额外空间 O(1)。

### C++ 实现

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

**代码经验：** 访问 `matrix[0]` 要求至少一行；`reserve(m*n)` 预留输出容量，不改变结果大小。

### Python 实现

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

**代码经验：** `range(right, left-1, -1)` 包含 `left`；右边扫描可能为空，此时仍需按顺序收缩边界。

## 旋转图像

### 题目描述

将 n × n 矩阵原地顺时针旋转 90 度。例如 `[[1,2],[3,4]]` 变为 `[[3,1],[4,2]]`。

### 思路

1. 沿主对角线转置：只遍历 `j < i`，交换 `matrix[i][j]` 与 `matrix[j][i]`，避免重复交换。
2. 逐行左右反转。原位置 `(i,j)` 经转置变为 `(j,i)`，再反转变为 `(j,n-1-i)`，正是顺时针旋转的位置。

**复杂度：** 时间 O(n<sup>2</sup>)，只用固定数量的临时变量，额外空间 O(1)。

### C++ 实现

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

**代码经验：** `matrix` 以引用传入，两个辅助函数直接修改原矩阵。

### Python 实现

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

**代码经验：** 多重赋值交换元素时右侧先求值；辅助函数定义在 `rotate` 内，并接收矩阵与大小。

## 搜索二维矩阵 II

### 题目描述

给定非空矩阵，每行从左到右、每列从上到下均升序，判断目标值是否存在。例如在 `[[1,4,7],[2,5,8],[3,6,9]]` 中查找 `6`，结果为真。

### 思路

1. 从右上角开始。当前值等于目标时返回真。
2. 目标更大则排除当前行并向下；目标更小则排除当前列并向左。
3. 离开矩阵仍未找到时返回假。

**复杂度：** 每步排除一行或一列，时间 O(m+n)，额外空间 O(1)。

### C++ 实现

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

**代码经验：** `j` 使用有符号 `int` 才能在减到 `-1` 后终止；访问首行要求矩阵非空。

### Python 实现

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

**代码经验：** 边界检查阻止 `j = -1` 被当作合法负下标；独立运行时需要导入 `typing.List`。

## 相交链表

### 题目描述

给定两个无环单链表，返回它们开始共享的节点；没有相交则返回空。相交依据节点身份，而非节点值相等。

### 思路

1. 两个指针分别从两个头节点出发，每次前进一步；走到空指针后转到另一条链表的头部。
2. 两个指针先后走过相同的两段长度。如果有公共尾部，它们会在交点相遇；否则最终都为空。

**复杂度：** 时间 O(m+n)，额外空间 O(1)，不修改链表。

### C++ 实现

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

**代码经验：** 指针相等比较的是节点地址；返回空指针也表示没有交点。

### Python 实现

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

**代码经验：** 题目默认节点按身份比较；若自定义节点重载了 `__eq__`，需留意 `!=` 的语义。独立运行需提供节点类型并导入 `Optional`。

## 反转链表

### 题目描述

原地反转单链表并返回新头节点。例如 `1 → 2 → 3` 变为 `3 → 2 → 1`；空链表返回空。

### 思路

1. `prev` 指向已反转部分，`cur` 指向尚未处理的节点。
2. 先保存 `cur.next`，再令当前节点指向 `prev`；依次推进两个指针。
3. 循环结束时 `prev` 是新头节点。

**复杂度：** 时间 O(n)，额外空间 O(1)。

### C++ 实现

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

**代码经验：** 必须先保存后继再改指针，否则会丢失尚未处理的链表；节点由平台提供，代码不创建新节点。

### Python 实现

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

**代码经验：** `None` 表示空节点；`ListNode | None` 标注需要 Python 3.10 或更高版本，独立运行时还需提供节点类型。

## 回文链表

### 题目描述

判断单链表从头到尾的节点值是否构成回文序列。空链表和单节点链表都是回文。

### 思路

1. 用快慢指针找到链表中点；奇数长度时跳过正中间节点。
2. 原地反转后半段链表，再从头节点和反转后的后半段同时比较。
3. 任意一对值不同就不是回文；全部匹配则是回文。

**复杂度：** 时间 O(n)，额外空间 O(1)。该方法会反转后半段，题目不要求恢复链表。

### C++ 实现

```cpp
class Solution {
public:
    bool isPalindrome(ListNode* head) {
        ListNode* slow = head;
        ListNode* fast = head;
        while (fast && fast->next) {
            slow = slow->next;
            fast = fast->next->next;
        }
        if (fast) slow = slow->next;

        ListNode* prev = nullptr;
        while (slow) {
            ListNode* next = slow->next;
            slow->next = prev;
            prev = slow;
            slow = next;
        }
        while (prev) {
            if (head->val != prev->val) return false;
            head = head->next;
            prev = prev->next;
        }
        return true;
    }
};
```

### Python 实现

```python
class Solution:
    def isPalindrome(self, head: Optional[ListNode]) -> bool:
        slow = fast = head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
        if fast:
            slow = slow.next

        prev = None
        while slow:
            nxt = slow.next
            slow.next = prev
            prev, slow = slow, nxt
        while prev:
            if head.val != prev.val:
                return False
            head, prev = head.next, prev.next
        return True
```

**代码经验：** 快指针是否为空区分奇偶长度；奇数长度时慢指针正好停在中点，需从中点的下一个节点开始比较。

## 环形链表

### 题目描述

判断单链表中是否存在环。若某个节点的 `next` 指向此前访问过的节点，链表就会形成环。

### 思路

1. 慢指针每轮走一步，快指针每轮走两步。
2. 若链表有环，快指针会在环内追上慢指针；若无环，快指针会先到达空指针。

**复杂度：** 时间 O(n)，额外空间 O(1)。

### C++ 实现

```cpp
class Solution {
public:
    bool hasCycle(ListNode* head) {
        ListNode* slow = head;
        ListNode* fast = head;
        while (fast && fast->next) {
            slow = slow->next;
            fast = fast->next->next;
            if (slow == fast) return true;
        }
        return false;
    }
};
```

### Python 实现

```python
class Solution:
    def hasCycle(self, head: Optional[ListNode]) -> bool:
        slow = fast = head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
            if slow is fast:
                return True
        return False
```

**代码经验：** 比较指针身份，不比较节点值；值重复并不意味着链表成环。

## 环形链表 II

### 题目描述

若链表有环，返回环的入口节点；若没有环，返回空指针。

### 思路

1. 用快慢指针相遇来确认有环，并记录相遇点。
2. 一个指针回到头节点，另一个留在相遇点；之后两者每次都走一步。
3. 两指针再次相遇的位置就是环的入口。

**复杂度：** 时间 O(n)，额外空间 O(1)。

### C++ 实现

```cpp
class Solution {
public:
    ListNode* detectCycle(ListNode* head) {
        ListNode* slow = head;
        ListNode* fast = head;
        do {
            if (!fast || !fast->next) return nullptr;
            slow = slow->next;
            fast = fast->next->next;
        } while (slow != fast);

        slow = head;
        while (slow != fast) {
            slow = slow->next;
            fast = fast->next;
        }
        return slow;
    }
};
```

### Python 实现

```python
class Solution:
    def detectCycle(self, head: Optional[ListNode]) -> Optional[ListNode]:
        slow = fast = head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
            if slow is fast:
                slow = head
                while slow is not fast:
                    slow = slow.next
                    fast = fast.next
                return slow
        return None
```

**代码经验：** C++ 的 `do` 循环在每轮开始先检查快指针及其后继，单节点无环时会立即返回空指针。

## 合并两个有序链表

### 题目描述

将两个升序单链表合并为一个升序链表，并返回合并后的头节点。可以直接复用原节点。

### 思路

1. 建立虚拟头节点，尾指针始终指向已合并部分的末端。
2. 比较两个当前节点，把较小者接到尾指针后并推进对应链表。
3. 一条链表耗尽后，直接接上另一条剩余链表。

**复杂度：** 时间 O(m+n)，额外空间 O(1)。

### C++ 实现

```cpp
class Solution {
public:
    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {
        ListNode dummy(0);
        ListNode* tail = &dummy;
        while (list1 && list2) {
            if (list1->val <= list2->val) {
                tail->next = list1;
                list1 = list1->next;
            } else {
                tail->next = list2;
                list2 = list2->next;
            }
            tail = tail->next;
        }
        tail->next = list1 ? list1 : list2;
        return dummy.next;
    }
};
```

### Python 实现

```python
class Solution:
    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:
        dummy = ListNode()
        tail = dummy
        while list1 and list2:
            if list1.val <= list2.val:
                tail.next, list1 = list1, list1.next
            else:
                tail.next, list2 = list2, list2.next
            tail = tail.next
        tail.next = list1 or list2
        return dummy.next
```

**代码经验：** 虚拟头节点省去了单独处理首个节点的分支；合并过程不创建数据节点。

## 两数相加

### 题目描述

两个非空链表分别表示两个非负整数，数字按逆序存储。逐位相加并返回同样按逆序存储的结果链表。

### 思路

1. 同时遍历两个链表，并维护当前进位 `carry`。
2. 每位计算 `sum = x + y + carry`，新节点保存 `sum % 10`，下一轮进位为 `sum / 10`。
3. 两链表都结束后，若仍有进位，再追加一个节点。

**复杂度：** 时间 O(max(m,n))，结果链表占用 O(max(m,n)) 空间。

### C++ 实现

```cpp
class Solution {
public:
    ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {
        ListNode dummy(0);
        ListNode* tail = &dummy;
        int carry = 0;
        while (l1 || l2 || carry) {
            int sum = carry;
            if (l1) {
                sum += l1->val;
                l1 = l1->next;
            }
            if (l2) {
                sum += l2->val;
                l2 = l2->next;
            }
            carry = sum / 10;
            tail->next = new ListNode(sum % 10);
            tail = tail->next;
        }
        return dummy.next;
    }
};
```

### Python 实现

```python
class Solution:
    def addTwoNumbers(self, l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:
        dummy = ListNode()
        tail = dummy
        carry = 0
        while l1 or l2 or carry:
            total = carry
            if l1:
                total += l1.val
                l1 = l1.next
            if l2:
                total += l2.val
                l2 = l2.next
            carry, digit = divmod(total, 10)
            tail.next = ListNode(digit)
            tail = tail.next
        return dummy.next
```

**代码经验：** 循环条件包含 `carry`，因此最高位相加产生进位时会多生成一位。

## 删除链表的倒数第 N 个结点

### 题目描述

删除单链表的倒数第 `n` 个节点，并返回新的头节点。`n` 在链表长度范围内。

### 思路

1. 在头节点前添加虚拟节点，快慢指针都从虚拟节点出发。
2. 快指针先前进 `n` 步，再让快慢指针同步前进。
3. 快指针到达尾节点时，慢指针正好位于待删节点的前一个位置。

**复杂度：** 时间 O(n)，额外空间 O(1)。

### C++ 实现

```cpp
class Solution {
public:
    ListNode* removeNthFromEnd(ListNode* head, int n) {
        ListNode dummy(0);
        dummy.next = head;
        ListNode* fast = &dummy;
        ListNode* slow = &dummy;
        for (int i = 0; i < n; ++i) fast = fast->next;
        while (fast->next) {
            fast = fast->next;
            slow = slow->next;
        }
        ListNode* removed = slow->next;
        slow->next = removed->next;
        delete removed;
        return dummy.next;
    }
};
```

### Python 实现

```python
class Solution:
    def removeNthFromEnd(self, head: Optional[ListNode], n: int) -> Optional[ListNode]:
        dummy = ListNode(0, head)
        fast = slow = dummy
        for _ in range(n):
            fast = fast.next
        while fast.next:
            fast = fast.next
            slow = slow.next
        slow.next = slow.next.next
        return dummy.next
```

**代码经验：** 虚拟头节点让删除原头节点时仍使用同一套指针逻辑；题目保证 `n` 合法，因此快指针前进时无需额外判空。

## 两两交换链表中的节点

### 题目描述

按相邻两节点为一组交换链表节点，返回新头节点。只能改变节点连接关系，不能只交换节点值。

### 思路

1. 虚拟头节点的 `next` 指向当前待交换的一对节点。
2. 令前驱指向第二个节点，第二个节点指向第一个节点，第一个节点指向后续部分。
3. 前驱移动到交换后的一对尾节点；不足两个节点时结束。

**复杂度：** 时间 O(n)，额外空间 O(1)。

### C++ 实现

```cpp
class Solution {
public:
    ListNode* swapPairs(ListNode* head) {
        ListNode dummy(0, head);
        ListNode* prev = &dummy;
        while (prev->next && prev->next->next) {
            ListNode* first = prev->next;
            ListNode* second = first->next;
            first->next = second->next;
            second->next = first;
            prev->next = second;
            prev = first;
        }
        return dummy.next;
    }
};
```

### Python 实现

```python
class Solution:
    def swapPairs(self, head: Optional[ListNode]) -> Optional[ListNode]:
        dummy = ListNode(0, head)
        prev = dummy
        while prev.next and prev.next.next:
            first = prev.next
            second = first.next
            first.next = second.next
            second.next = first
            prev.next = second
            prev = first
        return dummy.next
```

**代码经验：** 先保存这一组的两个节点，再调整三条边，能避免覆盖尚未处理的后续链表。

## K 个一组翻转链表

### 题目描述

每 `k` 个节点为一组翻转链表，不足 `k` 个的尾部保持原顺序。节点值不变，只调整指针。

### 思路

1. 从组前驱出发向后找第 `k` 个节点；找不到说明剩余节点不足一组，直接结束。
2. 记下组后节点，把组内节点逐个反转，并让原组头指向组后节点。
3. 更新组前驱到本组原头节点，继续处理下一组。

**复杂度：** 时间 O(n)，额外空间 O(1)。

### C++ 实现

```cpp
class Solution {
public:
    ListNode* reverseKGroup(ListNode* head, int k) {
        ListNode dummy(0, head);
        ListNode* groupPrev = &dummy;
        while (true) {
            ListNode* kth = groupPrev;
            for (int i = 0; i < k && kth; ++i) kth = kth->next;
            if (!kth) break;

            ListNode* groupNext = kth->next;
            ListNode* cur = groupPrev->next;
            ListNode* prev = groupNext;
            while (cur != groupNext) {
                ListNode* next = cur->next;
                cur->next = prev;
                prev = cur;
                cur = next;
            }
            ListNode* oldHead = groupPrev->next;
            groupPrev->next = kth;
            groupPrev = oldHead;
        }
        return dummy.next;
    }
};
```

### Python 实现

```python
class Solution:
    def reverseKGroup(self, head: Optional[ListNode], k: int) -> Optional[ListNode]:
        dummy = ListNode(0, head)
        group_prev = dummy
        while True:
            kth = group_prev
            for _ in range(k):
                kth = kth.next
                if not kth:
                    return dummy.next
            group_next = kth.next

            prev, cur = group_next, group_prev.next
            while cur is not group_next:
                nxt = cur.next
                cur.next = prev
                prev, cur = cur, nxt
            old_head = group_prev.next
            group_prev.next = kth
            group_prev = old_head
```

**代码经验：** 反转时把 `prev` 初始设为组后节点，处理完本组后，原组头自然连接到未处理部分。

## 随机链表的复制

### 题目描述

链表每个节点除 `next` 外还有一个 `random` 指针，它可以指向链表中的任意节点或空。创建一份深拷贝并返回新头节点。

### 思路

1. 第一次遍历为每个原节点创建副本，并用哈希表保存“原节点 → 副本节点”。
2. 第二次遍历时，分别通过映射设置副本的 `next` 和 `random`。
3. 返回头节点对应的副本；原链表与副本之间不共享节点。

**复杂度：** 时间 O(n)，额外空间 O(n)。

### C++ 实现

```cpp
/*
class Node {
public:
    int val;
    Node* next;
    Node* random;
    Node(int _val) : val(_val), next(nullptr), random(nullptr) {}
};
*/
class Solution {
public:
    Node* copyRandomList(Node* head) {
        if (!head) return nullptr;
        unordered_map<Node*, Node*> copies;
        for (Node* cur = head; cur; cur = cur->next) {
            copies[cur] = new Node(cur->val);
        }
        for (Node* cur = head; cur; cur = cur->next) {
            copies[cur]->next = cur->next ? copies[cur->next] : nullptr;
            copies[cur]->random = cur->random ? copies[cur->random] : nullptr;
        }
        return copies[head];
    }
};
```

### Python 实现

```python
class Solution:
    def copyRandomList(self, head: Optional["Node"]) -> Optional["Node"]:
        if not head:
            return None
        copies = {}
        cur = head
        while cur:
            copies[cur] = Node(cur.val)
            cur = cur.next
        cur = head
        while cur:
            copies[cur].next = copies.get(cur.next)
            copies[cur].random = copies.get(cur.random)
            cur = cur.next
        return copies[head]
```

**代码经验：** 映射使用节点对象而不是节点值作键，因为不同节点可能有相同值。

## 排序链表

### 题目描述

将单链表按节点值升序排序，要求平均时间复杂度为 O(n log n)，并尽量减少额外空间。

### 思路

1. 使用归并排序：快慢指针找中点并断开链表，递归排序两半。
2. 将两个已排序链表归并。链表归并不需要像数组那样申请临时缓冲区。
3. 递归深度为 O(log n)，拆分和合并每层总计处理 O(n) 个节点。

**复杂度：** 时间 O(n log n)，递归栈 O(log n)。

### C++ 实现

```cpp
class Solution {
    ListNode* merge(ListNode* a, ListNode* b) {
        ListNode dummy(0);
        ListNode* tail = &dummy;
        while (a && b) {
            if (a->val <= b->val) {
                tail->next = a;
                a = a->next;
            } else {
                tail->next = b;
                b = b->next;
            }
            tail = tail->next;
        }
        tail->next = a ? a : b;
        return dummy.next;
    }
public:
    ListNode* sortList(ListNode* head) {
        if (!head || !head->next) return head;
        ListNode* slow = head;
        ListNode* fast = head->next;
        while (fast && fast->next) {
            slow = slow->next;
            fast = fast->next->next;
        }
        ListNode* right = slow->next;
        slow->next = nullptr;
        return merge(sortList(head), sortList(right));
    }
};
```

### Python 实现

```python
class Solution:
    def sortList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        if not head or not head.next:
            return head
        slow, fast = head, head.next
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
        right = slow.next
        slow.next = None

        left = self.sortList(head)
        right = self.sortList(right)
        dummy = ListNode()
        tail = dummy
        while left and right:
            if left.val <= right.val:
                tail.next, left = left, left.next
            else:
                tail.next, right = right, right.next
            tail = tail.next
        tail.next = left or right
        return dummy.next
```

**代码经验：** 先将链表从中点断开，否则递归调用可能再次收到原链表并无法缩小问题规模。

## 合并 K 个升序链表

### 题目描述

给定 `k` 个升序链表，将它们合并为一个升序链表并返回头节点。

### 思路

1. 将每条非空链表的头节点放入最小堆。
2. 每次取出当前最小节点接到结果尾部，再把它的后继节点放入堆。
3. 堆中最多有 `k` 个节点，因此每个节点只需一次 O(log k) 的堆操作。

**复杂度：** 总节点数为 N，时间 O(N log k)，额外空间 O(k)。

### C++ 实现

```cpp
class Solution {
    struct Compare {
        bool operator()(ListNode* a, ListNode* b) const {
            return a->val > b->val;
        }
    };
public:
    ListNode* mergeKLists(vector<ListNode*>& lists) {
        priority_queue<ListNode*, vector<ListNode*>, Compare> heap;
        for (ListNode* node : lists) {
            if (node) heap.push(node);
        }
        ListNode dummy(0);
        ListNode* tail = &dummy;
        while (!heap.empty()) {
            ListNode* node = heap.top();
            heap.pop();
            if (node->next) heap.push(node->next);
            tail->next = node;
            tail = node;
        }
        tail->next = nullptr;
        return dummy.next;
    }
};
```

### Python 实现

```python
import heapq

class Solution:
    def mergeKLists(self, lists: List[Optional[ListNode]]) -> Optional[ListNode]:
        heap = []
        for index, node in enumerate(lists):
            if node:
                heapq.heappush(heap, (node.val, index, node))
        dummy = ListNode()
        tail = dummy
        order = len(lists)
        while heap:
            _, _, node = heapq.heappop(heap)
            tail.next = node
            tail = node
            if node.next:
                heapq.heappush(heap, (node.next.val, order, node.next))
                order += 1
        tail.next = None
        return dummy.next
```

**代码经验：** Python 堆元组加入递增序号，避免值相同时继续比较不可排序的节点对象。

## LRU 缓存

### 题目描述

实现最近最少使用（LRU）缓存，支持 `get` 和 `put`。当容量已满并插入新键时，删除最久未使用的键。

### 思路

1. 哈希表提供键到链表节点的 O(1) 定位。
2. 双向链表按最近使用顺序排列：头部最近，尾部最久。
3. 访问或更新时把节点移动到头部；插入后若超容量，删除尾节点。

**复杂度：** `get` 和 `put` 平均 O(1)，空间 O(capacity)。

### C++ 实现

```cpp
class LRUCache {
    int capacity;
    list<pair<int, int>> order;
    unordered_map<int, list<pair<int, int>>::iterator> positions;
public:
    LRUCache(int capacity) : capacity(capacity) {}

    int get(int key) {
        auto it = positions.find(key);
        if (it == positions.end()) return -1;
        order.splice(order.begin(), order, it->second);
        return it->second->second;
    }

    void put(int key, int value) {
        auto it = positions.find(key);
        if (it != positions.end()) {
            it->second->second = value;
            order.splice(order.begin(), order, it->second);
            return;
        }
        if (capacity == 0) return;
        if (static_cast<int>(order.size()) == capacity) {
            positions.erase(order.back().first);
            order.pop_back();
        }
        order.emplace_front(key, value);
        positions[key] = order.begin();
    }
};
```

### Python 实现

```python
from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.items = OrderedDict()

    def get(self, key: int) -> int:
        if key not in self.items:
            return -1
        self.items.move_to_end(key)
        return self.items[key]

    def put(self, key: int, value: int) -> None:
        if key in self.items:
            self.items.move_to_end(key)
        self.items[key] = value
        if len(self.items) > self.capacity:
            self.items.popitem(last=False)
```

**代码经验：** `std::list::splice` 可在 O(1) 时间移动节点且保持迭代器有效；Python 的 `OrderedDict` 提供对应的顺序维护操作。

## 二叉树的中序遍历

### 题目描述

按左子树、根节点、右子树的顺序遍历二叉树，并返回节点值列表。

### 思路

1. 沿当前节点的左边界不断入栈。
2. 左边界走完后弹出栈顶并访问，再转向它的右子树。
3. 栈和当前节点都为空时遍历结束。

**复杂度：** 时间 O(n)，额外空间 O(h)，其中 h 为树高。

### C++ 实现

```cpp
class Solution {
public:
    vector<int> inorderTraversal(TreeNode* root) {
        vector<int> result;
        stack<TreeNode*> nodes;
        TreeNode* cur = root;
        while (cur || !nodes.empty()) {
            while (cur) {
                nodes.push(cur);
                cur = cur->left;
            }
            cur = nodes.top();
            nodes.pop();
            result.push_back(cur->val);
            cur = cur->right;
        }
        return result;
    }
};
```

### Python 实现

```python
class Solution:
    def inorderTraversal(self, root: Optional[TreeNode]) -> List[int]:
        result, stack = [], []
        cur = root
        while cur or stack:
            while cur:
                stack.append(cur)
                cur = cur.left
            cur = stack.pop()
            result.append(cur.val)
            cur = cur.right
        return result
```

**代码经验：** 迭代写法避免树退化成链表时递归深度过大。

## 二叉树的最大深度

### 题目描述

返回二叉树从根节点到最远叶节点的节点数。空树深度为 0。

### 思路

1. 空节点返回深度 0。
2. 非空节点的深度等于左右子树较大深度加 1。

**复杂度：** 时间 O(n)，递归栈空间 O(h)。

### C++ 实现

```cpp
class Solution {
public:
    int maxDepth(TreeNode* root) {
        if (!root) return 0;
        return 1 + max(maxDepth(root->left), maxDepth(root->right));
    }
};
```

### Python 实现

```python
class Solution:
    def maxDepth(self, root: Optional[TreeNode]) -> int:
        if not root:
            return 0
        return 1 + max(self.maxDepth(root.left), self.maxDepth(root.right))
```

**代码经验：** 递归深度最坏为 O(n)，若输入可能是极深的链状树，可改用队列按层遍历。

## 翻转二叉树

### 题目描述

翻转一棵二叉树，交换每个节点的左右子树，并返回根节点。

### 思路

1. 空节点无需处理。
2. 交换当前节点的左右孩子，再分别递归翻转两个子树。

**复杂度：** 时间 O(n)，递归栈空间 O(h)。

### C++ 实现

```cpp
class Solution {
public:
    TreeNode* invertTree(TreeNode* root) {
        if (!root) return nullptr;
        swap(root->left, root->right);
        invertTree(root->left);
        invertTree(root->right);
        return root;
    }
};
```

### Python 实现

```python
class Solution:
    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:
        if root:
            root.left, root.right = root.right, root.left
            self.invertTree(root.left)
            self.invertTree(root.right)
        return root
```

**代码经验：** 直接原地交换指针，不需要新建树节点。

## 对称二叉树

### 题目描述

判断二叉树是否沿根节点中心轴镜像对称。空树视为对称。

### 思路

1. 对称比较一对节点：两者都为空时相等，一者为空时不相等。
2. 值相等后，比较左节点的左子树与右节点的右子树，以及左节点的右子树与右节点的左子树。

**复杂度：** 时间 O(n)，递归栈空间 O(h)。

### C++ 实现

```cpp
class Solution {
    bool mirror(TreeNode* a, TreeNode* b) {
        if (!a || !b) return a == b;
        return a->val == b->val
            && mirror(a->left, b->right)
            && mirror(a->right, b->left);
    }
public:
    bool isSymmetric(TreeNode* root) {
        return mirror(root, root);
    }
};
```

### Python 实现

```python
class Solution:
    def isSymmetric(self, root: Optional[TreeNode]) -> bool:
        def mirror(a, b):
            if not a or not b:
                return a is b
            return (a.val == b.val
                    and mirror(a.left, b.right)
                    and mirror(a.right, b.left))

        return mirror(root, root)
```

**代码经验：** 同一棵树中的两个相同节点值不够证明对称，子树位置也必须镜像对应。

## 二叉树的直径

### 题目描述

返回树中任意两节点之间最长路径的边数。路径不要求经过根节点。

### 思路

1. 后序遍历求每个节点左右子树的高度。
2. 以该节点为转折点的路径长度是左高加右高，用它更新全局最大值。
3. 向父节点返回当前节点的高度，即较大子树高度加 1。

**复杂度：** 时间 O(n)，递归栈空间 O(h)。

### C++ 实现

```cpp
class Solution {
public:
    int diameterOfBinaryTree(TreeNode* root) {
        int diameter = 0;
        function<int(TreeNode*)> height = [&](TreeNode* node) {
            if (!node) return 0;
            int left = height(node->left);
            int right = height(node->right);
            diameter = max(diameter, left + right);
            return 1 + max(left, right);
        };
        height(root);
        return diameter;
    }
};
```

### Python 实现

```python
class Solution:
    def diameterOfBinaryTree(self, root: Optional[TreeNode]) -> int:
        diameter = 0

        def height(node):
            nonlocal diameter
            if not node:
                return 0
            left = height(node.left)
            right = height(node.right)
            diameter = max(diameter, left + right)
            return 1 + max(left, right)

        height(root)
        return diameter
```

**代码经验：** 高度按节点数计算，直径按边数计算，所以候选值是左右高度之和，而不是再加当前节点。

## 二叉树的层序遍历

### 题目描述

从上到下逐层遍历二叉树，同一层按从左到右的顺序返回节点值。

### 思路

1. 用队列进行广度优先遍历。
2. 每轮先记录队列当前长度，只处理这一层已有节点。
3. 处理节点时把非空左、右孩子加入队尾。

**复杂度：** 时间 O(n)，队列空间 O(w)，w 为树的最大宽度。

### C++ 实现

```cpp
class Solution {
public:
    vector<vector<int>> levelOrder(TreeNode* root) {
        vector<vector<int>> result;
        if (!root) return result;
        queue<TreeNode*> nodes;
        nodes.push(root);
        while (!nodes.empty()) {
            int size = nodes.size();
            vector<int> level;
            while (size--) {
                TreeNode* node = nodes.front();
                nodes.pop();
                level.push_back(node->val);
                if (node->left) nodes.push(node->left);
                if (node->right) nodes.push(node->right);
            }
            result.push_back(level);
        }
        return result;
    }
};
```

### Python 实现

```python
from collections import deque

class Solution:
    def levelOrder(self, root: Optional[TreeNode]) -> List[List[int]]:
        if not root:
            return []
        result, queue = [], deque([root])
        while queue:
            level = []
            for _ in range(len(queue)):
                node = queue.popleft()
                level.append(node.val)
                if node.left:
                    queue.append(node.left)
                if node.right:
                    queue.append(node.right)
            result.append(level)
        return result
```

**代码经验：** 固定每轮开始时的队列长度，避免把下一层新加入的节点放进当前层结果。

## 将有序数组转换为二叉搜索树

### 题目描述

给定严格递增数组，将其转换为高度平衡的二叉搜索树。

### 思路

1. 当前区间的中间元素作为根节点，保证左右元素数量尽量相等。
2. 对中点左侧和右侧区间递归构造左右子树。
3. 区间为空时返回空节点。

**复杂度：** 时间 O(n)，递归栈空间 O(log n)，新树占用 O(n) 节点空间。

### C++ 实现

```cpp
class Solution {
    TreeNode* build(const vector<int>& nums, int left, int right) {
        if (left > right) return nullptr;
        int mid = left + (right - left) / 2;
        TreeNode* root = new TreeNode(nums[mid]);
        root->left = build(nums, left, mid - 1);
        root->right = build(nums, mid + 1, right);
        return root;
    }
public:
    TreeNode* sortedArrayToBST(vector<int>& nums) {
        return build(nums, 0, static_cast<int>(nums.size()) - 1);
    }
};
```

### Python 实现

```python
class Solution:
    def sortedArrayToBST(self, nums: List[int]) -> Optional[TreeNode]:
        def build(left, right):
            if left > right:
                return None
            mid = (left + right) // 2
            node = TreeNode(nums[mid])
            node.left = build(left, mid - 1)
            node.right = build(mid + 1, right)
            return node

        return build(0, len(nums) - 1)
```

**代码经验：** 输入已排序且元素互异；取中点能让左右子树的节点数差不超过 1。

## 验证二叉搜索树

### 题目描述

判断二叉树是否满足二叉搜索树性质：左子树所有节点小于当前节点，右子树所有节点大于当前节点。

### 思路

1. 递归时为节点维护一个开区间 `(lower, upper)`。
2. 当前值必须严格落在区间内；左子树上界收紧为当前值，右子树下界收紧为当前值。
3. 递归检查能同时覆盖整棵子树，不会漏掉远处节点造成的越界。

**复杂度：** 时间 O(n)，递归栈空间 O(h)。

### C++ 实现

```cpp
class Solution {
    bool valid(TreeNode* node, long long lower, long long upper) {
        if (!node) return true;
        if (node->val <= lower || node->val >= upper) return false;
        return valid(node->left, lower, node->val)
            && valid(node->right, node->val, upper);
    }
public:
    bool isValidBST(TreeNode* root) {
        return valid(root, LLONG_MIN, LLONG_MAX);
    }
};
```

### Python 实现

```python
class Solution:
    def isValidBST(self, root: Optional[TreeNode]) -> bool:
        def valid(node, lower, upper):
            if not node:
                return True
            if not lower < node.val < upper:
                return False
            return (valid(node.left, lower, node.val)
                    and valid(node.right, node.val, upper))

        return valid(root, float("-inf"), float("inf"))
```

**代码经验：** C++ 需要比节点值范围更宽的边界类型，否则用节点值初始化上下界可能溢出。

## 二叉搜索树中第 K 小的元素

### 题目描述

返回二叉搜索树按升序排列后的第 `k` 小节点值，题目保证 `k` 合法。

### 思路

1. 二叉搜索树的中序遍历结果递增。
2. 迭代执行中序遍历，每访问一个节点就将计数减一。
3. 计数降为零时当前值就是第 `k` 小元素，无需遍历剩余节点。

**复杂度：** 最坏时间 O(n)，额外空间 O(h)。

### C++ 实现

```cpp
class Solution {
public:
    int kthSmallest(TreeNode* root, int k) {
        stack<TreeNode*> nodes;
        while (root || !nodes.empty()) {
            while (root) {
                nodes.push(root);
                root = root->left;
            }
            root = nodes.top();
            nodes.pop();
            if (--k == 0) return root->val;
            root = root->right;
        }
        return -1;
    }
};
```

### Python 实现

```python
class Solution:
    def kthSmallest(self, root: Optional[TreeNode], k: int) -> int:
        stack = []
        while root or stack:
            while root:
                stack.append(root)
                root = root.left
            root = stack.pop()
            k -= 1
            if k == 0:
                return root.val
            root = root.right
        return -1
```

**代码经验：** 中序遍历可以提前停止，若需要多次查询不同的 `k`，可考虑预先保存中序序列。

## 二叉树的右视图

### 题目描述

从树的右侧观察二叉树，返回从上到下每一层最右侧可见的节点值。

### 思路

1. 按层广度优先遍历。
2. 每层按从左到右处理，记录该层最后一个节点的值。

**复杂度：** 时间 O(n)，队列空间 O(w)，w 为树的最大宽度。

### C++ 实现

```cpp
class Solution {
public:
    vector<int> rightSideView(TreeNode* root) {
        vector<int> result;
        if (!root) return result;
        queue<TreeNode*> nodes;
        nodes.push(root);
        while (!nodes.empty()) {
            int size = nodes.size();
            for (int i = 0; i < size; ++i) {
                TreeNode* node = nodes.front();
                nodes.pop();
                if (node->left) nodes.push(node->left);
                if (node->right) nodes.push(node->right);
                if (i == size - 1) result.push_back(node->val);
            }
        }
        return result;
    }
};
```

### Python 实现

```python
from collections import deque

class Solution:
    def rightSideView(self, root: Optional[TreeNode]) -> List[int]:
        if not root:
            return []
        result, queue = [], deque([root])
        while queue:
            level_size = len(queue)
            for i in range(level_size):
                node = queue.popleft()
                if node.left:
                    queue.append(node.left)
                if node.right:
                    queue.append(node.right)
                if i == level_size - 1:
                    result.append(node.val)
        return result
```

**代码经验：** Python 版本中队列长度会随着入队改变，因此不能用 `len(queue)` 判断当前层末尾；应在循环前保存层大小。

## 二叉树展开为链表

### 题目描述

将二叉树原地展开为按前序遍历顺序连接的单链表，所有节点只使用右指针，左指针置空。

### 思路

1. 用栈模拟前序遍历，先压右孩子，再压左孩子。
2. 每取出一个节点，就把它接到上一个节点的右侧，并清空上一个节点的左指针。
3. 所有节点处理后，将末节点的左右指针都置空。

**复杂度：** 时间 O(n)，栈空间 O(n)。

### C++ 实现

```cpp
class Solution {
public:
    void flatten(TreeNode* root) {
        if (!root) return;
        stack<TreeNode*> nodes;
        nodes.push(root);
        TreeNode* prev = nullptr;
        while (!nodes.empty()) {
            TreeNode* node = nodes.top();
            nodes.pop();
            if (prev) {
                prev->left = nullptr;
                prev->right = node;
            }
            if (node->right) nodes.push(node->right);
            if (node->left) nodes.push(node->left);
            prev = node;
        }
        prev->left = nullptr;
        prev->right = nullptr;
    }
};
```

### Python 实现

```python
class Solution:
    def flatten(self, root: Optional[TreeNode]) -> None:
        if not root:
            return
        stack, prev = [root], None
        while stack:
            node = stack.pop()
            if prev:
                prev.left = None
                prev.right = node
            if node.right:
                stack.append(node.right)
            if node.left:
                stack.append(node.left)
            prev = node
        prev.left = None
        prev.right = None
```

**代码经验：** 入栈顺序与弹出顺序相反，先压右孩子才能先处理左子树，得到根、左、右的前序次序。

## 从前序与中序遍历序列构造二叉树

### 题目描述

给定无重复值的前序和中序遍历序列，重建并返回对应二叉树。

### 思路

1. 前序序列当前元素是子树根节点。
2. 用哈希表快速查找根在中序序列中的位置，据此确定左右子树区间。
3. 按前序顺序递归构造左子树和右子树。

**复杂度：** 时间 O(n)，哈希表和递归栈空间 O(n)。

### C++ 实现

```cpp
class Solution {
public:
    TreeNode* buildTree(vector<int>& preorder, vector<int>& inorder) {
        unordered_map<int, int> inorderIndex;
        for (int i = 0; i < static_cast<int>(inorder.size()); ++i) {
            inorderIndex[inorder[i]] = i;
        }
        int preorderIndex = 0;
        function<TreeNode*(int, int)> build = [&](int left, int right) -> TreeNode* {
            if (left > right) return nullptr;
            int value = preorder[preorderIndex++];
            int mid = inorderIndex[value];
            TreeNode* root = new TreeNode(value);
            root->left = build(left, mid - 1);
            root->right = build(mid + 1, right);
            return root;
        };
        return build(0, static_cast<int>(inorder.size()) - 1);
    }
};
```

### Python 实现

```python
class Solution:
    def buildTree(self, preorder: List[int], inorder: List[int]) -> Optional[TreeNode]:
        positions = {value: i for i, value in enumerate(inorder)}
        self.pre_index = 0

        def build(left, right):
            if left > right:
                return None
            value = preorder[self.pre_index]
            self.pre_index += 1
            root = TreeNode(value)
            mid = positions[value]
            root.left = build(left, mid - 1)
            root.right = build(mid + 1, right)
            return root

        return build(0, len(inorder) - 1)
```

**代码经验：** 该方法依赖节点值唯一；重复值会让中序位置无法由值唯一确定。

## 路径总和 III

### 题目描述

统计二叉树中路径和等于目标值的路径数量。路径必须向下，但可以从任意节点开始并在任意节点结束。

### 思路

1. 沿根到当前节点维护前缀和 `sum`。
2. 若此前某个前缀和为 `sum - target`，两者之间的节点路径和就是目标值。
3. 用哈希表记录当前递归路径上的前缀和次数；回溯离开节点时撤销当前前缀和。

**复杂度：** 时间 O(n)，哈希表和递归栈空间 O(h)。

### C++ 实现

```cpp
class Solution {
    long long countFrom(TreeNode* node, long long sum, int target,
                        unordered_map<long long, int>& prefix) {
        if (!node) return 0;
        sum += node->val;
        long long count = prefix[sum - target];
        ++prefix[sum];
        count += countFrom(node->left, sum, target, prefix);
        count += countFrom(node->right, sum, target, prefix);
        if (--prefix[sum] == 0) prefix.erase(sum);
        return count;
    }
public:
    int pathSum(TreeNode* root, int targetSum) {
        unordered_map<long long, int> prefix{{0, 1}};
        return static_cast<int>(countFrom(root, 0, targetSum, prefix));
    }
};
```

### Python 实现

```python
from collections import defaultdict

class Solution:
    def pathSum(self, root: Optional[TreeNode], targetSum: int) -> int:
        prefix = defaultdict(int)
        prefix[0] = 1

        def count_from(node, total):
            if not node:
                return 0
            total += node.val
            count = prefix[total - targetSum]
            prefix[total] += 1
            count += count_from(node.left, total)
            count += count_from(node.right, total)
            prefix[total] -= 1
            return count

        return count_from(root, 0)
```

**代码经验：** 前缀和计数必须在回溯时减回去，否则一个分支的路径会错误影响另一个分支。

## 二叉树的最近公共祖先

### 题目描述

给定二叉树中的两个节点 `p` 和 `q`，返回它们的最近公共祖先。题目保证两个节点都存在。

### 思路

1. 当前节点为空或等于 `p`、`q` 时直接返回当前节点。
2. 分别在左右子树递归查找。
3. 若左右都找到目标，当前节点就是最近公共祖先；若只有一侧找到，就向上传递该结果。

**复杂度：** 时间 O(n)，递归栈空间 O(h)。

### C++ 实现

```cpp
class Solution {
public:
    TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {
        if (!root || root == p || root == q) return root;
        TreeNode* left = lowestCommonAncestor(root->left, p, q);
        TreeNode* right = lowestCommonAncestor(root->right, p, q);
        if (left && right) return root;
        return left ? left : right;
    }
};
```

### Python 实现

```python
class Solution:
    def lowestCommonAncestor(self, root: TreeNode, p: TreeNode, q: TreeNode) -> TreeNode:
        if not root or root is p or root is q:
            return root
        left = self.lowestCommonAncestor(root.left, p, q)
        right = self.lowestCommonAncestor(root.right, p, q)
        if left and right:
            return root
        return left or right
```

**代码经验：** 用节点身份判断是否命中目标，避免值相等但对象不同造成误判。

## 二叉树中的最大路径和

### 题目描述

返回二叉树中任意非空路径的最大节点值之和。路径可以从任意节点开始和结束，但沿父子边连接。

### 思路

1. 后序遍历计算节点向父节点提供的最大单边贡献；负贡献按 0 处理。
2. 经过当前节点的候选路径和为节点值加左右两侧的正贡献。
3. 用候选路径更新全局最大值，再返回节点值加左右较大的单侧贡献。

**复杂度：** 时间 O(n)，递归栈空间 O(h)。

### C++ 实现

```cpp
class Solution {
public:
    int maxPathSum(TreeNode* root) {
        int best = INT_MIN;
        function<int(TreeNode*)> gain = [&](TreeNode* node) {
            if (!node) return 0;
            int left = max(0, gain(node->left));
            int right = max(0, gain(node->right));
            best = max(best, node->val + left + right);
            return node->val + max(left, right);
        };
        gain(root);
        return best;
    }
};
```

### Python 实现

```python
class Solution:
    def maxPathSum(self, root: Optional[TreeNode]) -> int:
        best = float("-inf")

        def gain(node):
            nonlocal best
            if not node:
                return 0
            left = max(0, gain(node.left))
            right = max(0, gain(node.right))
            best = max(best, node.val + left + right)
            return node.val + max(left, right)

        gain(root)
        return best
```

**代码经验：** 返回父节点的贡献只能选择一侧；全局候选路径才可以同时使用左右子树。

## 岛屿数量

### 题目描述

给定由 `'1'`（陆地）和 `'0'`（水）组成的网格，统计由上下左右相连陆地组成的岛屿数量。

### 思路

1. 扫描网格，每遇到未访问陆地就找到一个新岛屿。
2. 用显式栈进行深度优先搜索，把连通的陆地全部标记为已访问。
3. 每个格子最多访问一次。

**复杂度：** 时间 O(mn)，显式栈最坏 O(mn)。

### C++ 实现

```cpp
class Solution {
public:
    int numIslands(vector<vector<char>>& grid) {
        if (grid.empty()) return 0;
        int m = grid.size(), n = grid[0].size();
        int islands = 0;
        const int dr[4] = {1, -1, 0, 0};
        const int dc[4] = {0, 0, 1, -1};
        for (int r = 0; r < m; ++r) {
            for (int c = 0; c < n; ++c) {
                if (grid[r][c] == '1') {
                    ++islands;
                    vector<pair<int, int>> cells{{r, c}};
                    grid[r][c] = '0';
                    while (!cells.empty()) {
                        auto [row, col] = cells.back();
                        cells.pop_back();
                        for (int d = 0; d < 4; ++d) {
                            int nr = row + dr[d], nc = col + dc[d];
                            if (nr < 0 || nr >= m || nc < 0 || nc >= n || grid[nr][nc] != '1') continue;
                            grid[nr][nc] = '0';
                            cells.push_back({nr, nc});
                        }
                    }
                }
            }
        }
        return islands;
    }
};
```

### Python 实现

```python
class Solution:
    def numIslands(self, grid: List[List[str]]) -> int:
        if not grid:
            return 0
        rows, cols = len(grid), len(grid[0])

        islands = 0
        directions = ((1, 0), (-1, 0), (0, 1), (0, -1))
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == "1":
                    islands += 1
                    stack = [(r, c)]
                    grid[r][c] = "0"
                    while stack:
                        row, col = stack.pop()
                        for dr, dc in directions:
                            nr, nc = row + dr, col + dc
                            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "1":
                                grid[nr][nc] = "0"
                                stack.append((nr, nc))
        return islands
```

**代码经验：** 这两种实现会原地把陆地改成水；若需要保留输入网格，可单独维护访问矩阵。

## 腐烂的橘子

### 题目描述

网格中 `0` 为空格、`1` 为新鲜橘子、`2` 为腐烂橘子。每分钟腐烂橘子会使相邻的新鲜橘子腐烂，返回全部橘子腐烂所需的最少分钟数；若无法全部腐烂则返回 `-1`。

### 思路

1. 把所有初始腐烂橘子同时加入队列，并统计新鲜橘子数量。
2. 广度优先搜索按分钟扩散，每层代表同一分钟内被感染的橘子。
3. 搜索结束后仍有新鲜橘子就返回 `-1`；否则返回扩散层数。

**复杂度：** 时间 O(mn)，队列空间 O(mn)。

### C++ 实现

```cpp
class Solution {
public:
    int orangesRotting(vector<vector<int>>& grid) {
        int m = grid.size(), n = grid[0].size();
        queue<pair<int, int>> rotten;
        int fresh = 0;
        for (int r = 0; r < m; ++r) {
            for (int c = 0; c < n; ++c) {
                if (grid[r][c] == 2) rotten.push({r, c});
                else if (grid[r][c] == 1) ++fresh;
            }
        }
        int minutes = 0;
        const int dr[4] = {1, -1, 0, 0};
        const int dc[4] = {0, 0, 1, -1};
        while (fresh && !rotten.empty()) {
            int size = rotten.size();
            while (size--) {
                auto [r, c] = rotten.front();
                rotten.pop();
                for (int d = 0; d < 4; ++d) {
                    int nr = r + dr[d], nc = c + dc[d];
                    if (nr < 0 || nr >= m || nc < 0 || nc >= n || grid[nr][nc] != 1) continue;
                    grid[nr][nc] = 2;
                    --fresh;
                    rotten.push({nr, nc});
                }
            }
            ++minutes;
        }
        return fresh == 0 ? minutes : -1;
    }
};
```

### Python 实现

```python
from collections import deque

class Solution:
    def orangesRotting(self, grid: List[List[int]]) -> int:
        rows, cols = len(grid), len(grid[0])
        queue = deque()
        fresh = 0
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == 2:
                    queue.append((r, c))
                elif grid[r][c] == 1:
                    fresh += 1

        minutes = 0
        directions = ((1, 0), (-1, 0), (0, 1), (0, -1))
        while fresh and queue:
            for _ in range(len(queue)):
                r, c = queue.popleft()
                for dr, dc in directions:
                    nr, nc = r + dr, c + dc
                    if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1:
                        grid[nr][nc] = 2
                        fresh -= 1
                        queue.append((nr, nc))
            minutes += 1
        return minutes if fresh == 0 else -1
```

**代码经验：** 初始没有新鲜橘子时循环不执行，答案为 0；所有初始腐烂橘子必须作为同一轮起点。

## 课程表

### 题目描述

给定课程数和先修关系，判断是否可以完成所有课程。先修关系 `[a, b]` 表示必须先修课程 `b` 才能学习课程 `a`。

### 思路

1. 把每个先修关系视为有向边 `b → a`，并统计每门课的入度。
2. 将所有入度为 0 的课程加入队列，逐个取出并删除其出边。
3. 若最终取出的课程数等于课程总数，图中无环，所有课程可完成。

**复杂度：** 时间 O(V+E)，空间 O(V+E)。

### C++ 实现

```cpp
class Solution {
public:
    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {
        vector<vector<int>> graph(numCourses);
        vector<int> indegree(numCourses, 0);
        for (const auto& edge : prerequisites) {
            graph[edge[1]].push_back(edge[0]);
            ++indegree[edge[0]];
        }
        queue<int> ready;
        for (int course = 0; course < numCourses; ++course) {
            if (indegree[course] == 0) ready.push(course);
        }
        int completed = 0;
        while (!ready.empty()) {
            int course = ready.front();
            ready.pop();
            ++completed;
            for (int next : graph[course]) {
                if (--indegree[next] == 0) ready.push(next);
            }
        }
        return completed == numCourses;
    }
};
```

### Python 实现

```python
from collections import deque

class Solution:
    def canFinish(self, numCourses: int, prerequisites: List[List[int]]) -> bool:
        graph = [[] for _ in range(numCourses)]
        indegree = [0] * numCourses
        for course, prerequisite in prerequisites:
            graph[prerequisite].append(course)
            indegree[course] += 1
        ready = deque(i for i, degree in enumerate(indegree) if degree == 0)
        completed = 0
        while ready:
            course = ready.popleft()
            completed += 1
            for next_course in graph[course]:
                indegree[next_course] -= 1
                if indegree[next_course] == 0:
                    ready.append(next_course)
        return completed == numCourses
```

**代码经验：** 多条边可以具有相同端点时，每条边都要计入入度，并在处理时各减一次。
