// Fullscreen API type definitions for cross-browser compatibility

export interface FullscreenElement extends Element {
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

export interface FullscreenDocument extends Document {
  webkitFullscreenElement?: Element;
  mozFullScreenElement?: Element;
  msFullscreenElement?: Element;
  webkitExitFullscreen?: () => Promise<void>;
  mozCancelFullScreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
  webkitFullscreenEnabled?: boolean;
  mozFullScreenEnabled?: boolean;
  msFullscreenEnabled?: boolean;
}

export interface FullscreenEventTarget extends EventTarget {
  addEventListener(
    type:
      | "fullscreenchange"
      | "webkitfullscreenchange"
      | "mozfullscreenchange"
      | "msfullscreenchange",
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener(
    type:
      | "fullscreenchange"
      | "webkitfullscreenchange"
      | "mozfullscreenchange"
      | "msfullscreenchange",
    listener: EventListener,
    options?: boolean | EventListenerOptions
  ): void;
}
