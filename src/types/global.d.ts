// 全局运行时挂载点。
// BaseLayout 的 <script is:inline> 在 head 解析期定义 __applyTheme，
// SiteHeader 的两态切换按钮调用它。
declare global {
	interface Window {
		/** 显式应用主题或读取首次系统偏好；存储受限时保留当前页面的选择。 */
		__applyTheme?: (next?: 'light' | 'dark') => void;
	}
}

export {};
