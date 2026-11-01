/** 隐藏画廊 /gallery/ 的照片。新增或替换后运行 `npm run gallery:prepare` 生成优化图。 */
export const photos = [
 { file: '两只小猫.jpg', title: '两只小猫', width: 1600, height: 1200 },
 { file: '第一顿饭.jpg', title: '第一顿饭', width: 1600, height: 1200 },
 { file: '恩施屏山峡谷.jpg', title: '恩施屏山峡谷', width: 1205, height: 1600 },
 { file: '抽象车流.jpg', title: '抽象车流', width: 1600, height: 1205 },
 { file: '官宣图.jpg', title: '官宣图', width: 1200, height: 1600 },
 { file: '碰杯.jpg', title: '碰杯', width: 1003, height: 1600 },
];
export type Photo = (typeof photos)[number];
