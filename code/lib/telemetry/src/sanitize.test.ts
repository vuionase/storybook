import { sanitizeError, cleanPaths } from './sanitize';

describe(`Errors Helpers`, () => {
  describe(`sanitizeError`, () => {
    it(`Sanitizes current path from error stacktraces`, () => {
      const errorMessage = `this is a test`;
      let e: any;
      try {
        throw new Error(errorMessage);
      } catch (error) {
        e = error;
      }
      expect(e).toBeDefined();
      expect(e.message).toEqual(errorMessage);
      expect(e.stack).toEqual(expect.stringContaining(process.cwd()));

      const sanitizedError = sanitizeError(e);

      expect(sanitizedError.message).toEqual(expect.stringContaining(errorMessage));
      expect(sanitizedError.message).toEqual(
        expect.not.stringContaining(process.cwd().replace(/\\/g, `\\\\`))
      );
    });

    it(`Sanitizes a section of the current path from error stacktrace`, () => {
      const errorMessage = `this is a test`;

      const e = {
        message: errorMessage,
        stack: `
        Error: this is an error
          at Object.<anonymous> (/Users/username/Code/storybook-app/storybook-config.js:1:32)
          at Object.<anonymous> (/Users/username/Code/storybook-app/node_module/storybook-telemetry/blah.js:1:69)
          at Object.<anonymous> (/Users/username/Code/storybook-app/node_module/fake-path/index.js:1:41)
          at Object.<anonymous> (/Users/username/.fake-path/index.js:1:69)
          at Module._compile (internal/modules/cjs/loader.js:736:30)
          at Object.Module._extensions..js (internal/modules/cjs/loader.js:747:10)
          at Module.load (internal/modules/cjs/loader.js:628:32)
          at tryModuleLoad (internal/modules/cjs/loader.js:568:12)
          at Function.Module._load (internal/modules/cjs/loader.js:560:3)
          at Function.Module.runMain (internal/modules/cjs/loader.js:801:12)
          at executeUserCode (internal/bootstrap/node.js:526:15)
          at startMainThreadExecution (internal/bootstrap/node.js:439:3)
        `,
      };

      expect(e).toBeDefined();
      expect(e.message).toEqual(errorMessage);
      expect(e.stack).toBeDefined();

      const mockCwd = jest
        .spyOn(process, `cwd`)
        .mockImplementation(() => `/Users/username/Code/storybook-app`);

      expect(e.stack).toEqual(expect.stringContaining(`username`));

      const sanitizedError = sanitizeError(e as Error, `/`);

      expect(sanitizedError.message.includes(errorMessage)).toBe(true);
      expect(sanitizedError.stack).toEqual(expect.not.stringContaining(`username`));
      const result = sanitizedError.stack.match(/\$SNIP/g) as Array<string>;
      expect(result.length).toBe(4);

      mockCwd.mockRestore();
    });
  });
  describe(`cleanPaths`, () => {
    it.each([`storybook-config.js`, `src/pages/index.js`])(
      `should clean path on unix: %s`,
      (filePath) => {
        const cwdMockPath = `/Users/username/storybook-app`;
        const fullPath = `${cwdMockPath}/${filePath}`;

        const mockCwd = jest.spyOn(process, `cwd`).mockImplementation(() => cwdMockPath);

        const errorMessage = `This path should be sanitized ${fullPath}`;

        expect(cleanPaths(errorMessage, `/`)).toBe(
          `This path should be sanitized $SNIP/${filePath}`
        );
        mockCwd.mockRestore();
      }
    );

    it.each([`storybook-config.js`, `src\\pages\\index.js`])(
      `should clean path on windows: %s`,
      (filePath) => {
        const cwdMockPath = `C:\\Users\\username\\storybook-app`;
        const fullPath = `${cwdMockPath}\\${filePath}`;

        const mockCwd = jest.spyOn(process, `cwd`).mockImplementation(() => cwdMockPath);

        const errorMessage = `This path should be sanitized ${fullPath}`;

        expect(cleanPaths(errorMessage, `\\`)).toBe(
          `This path should be sanitized $SNIP\\${filePath}`
        );
        mockCwd.mockRestore();
      }
    );
  });
});
