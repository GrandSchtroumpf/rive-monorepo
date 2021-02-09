import { canvas } from './canvas';

describe('wasm', () => {
  it('should work', () => {
    expect(canvas()).toEqual('wasm');
  });
});
