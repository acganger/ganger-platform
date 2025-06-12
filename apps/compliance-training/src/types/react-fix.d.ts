// Fix for React 18/19 type compatibility issues
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// Fix for ForwardRefExoticComponent JSX usage
declare global {
  namespace JSX {
    interface ElementChildrenAttribute {
      children: {};
    }
  }
}

export {};