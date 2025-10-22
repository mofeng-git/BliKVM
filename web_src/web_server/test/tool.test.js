import { generateUniqueCode } from '../src/common/tool.js';

test('generateUniqueCode should return unique codes', () => {
  const codes = Array.from({ length: 100000 }, generateUniqueCode);
  const uniqueCodes = new Set(codes);

  // console.log(codes);

  expect(uniqueCodes.size).toBe(codes.length);
});
