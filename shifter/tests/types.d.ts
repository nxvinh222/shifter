import 'jest';

// Add augmentation for Jest Mock
declare global {
  namespace jest {
    interface Mock<T = any, Y extends any[] = any[]> {
      new (...args: Y): T;
      (...args: Y): T;
    }
  }
} 