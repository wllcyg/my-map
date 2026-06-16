export const mapConfig = {
  // 乌鲁木齐附近作为一个宏观的中心点，适合看丝绸之路全貌
  initialCenter: [87.33, 43.82] as [number, number],
  initialZoom: 3,
  minZoom: 2,
  maxZoom: 10,
  maxBounds: [
    [-20, -10], // 西南角 (大致包括欧洲和北非)
    [150, 70],  // 东北角 (包括东亚和部分西伯利亚)
  ] as [[number, number], [number, number]],
  // 采用弱化现代元素（无国界、无现代城市名）的暖色底图，更贴合历史主题
  styleUrl: "https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json",
};
