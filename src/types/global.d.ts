// 全局运行时挂载点。
// BaseLayout 的 <script is:inline> 在 head 解析期定义 __applyTheme，
// SiteHeader 的三态切换按钮调用它。
declare global {
	interface Window {
		/** 依据 localStorage 的 theme 键（light/dark/未设置=跟随系统）重新应用主题，
		 *  并同步 data-theme、theme-color meta 与切换按钮状态。 */
		__applyTheme?: () => void;
	}
}

export {};
