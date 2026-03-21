/* model-viewer Web Component 类型声明 */
declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        src?: string;
        alt?: string;
        ar?: boolean;
        'ar-modes'?: string;
        'camera-controls'?: boolean;
        'auto-rotate'?: boolean;
        'shadow-intensity'?: string;
        'environment-image'?: string;
        exposure?: string;
        poster?: string;
        loading?: string;
        reveal?: string;
        style?: React.CSSProperties;
      },
      HTMLElement
    >;
  }
}
