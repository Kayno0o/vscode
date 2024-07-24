import * as vscode from 'vscode';

type Option = {
  title?: string
  prompt: string
  required?: boolean
  default?: string
  type?: 'string' | 'boolean' | 'number'
};

type Options = Record<string, Option>;

type Result<T extends Options> = {
  [K in keyof T]: T[K] extends { required: true }
    ? (T[K]['type'] extends 'boolean' ? boolean : string)
    : (T[K]['type'] extends 'boolean' ? boolean : string) | undefined
};

export default async function <T extends Options>(options: T): Promise<Result<T> | Error> {
  const result: Partial<Result<T>> = {};
  const keys = Object.keys(options) as (keyof T)[];

  async function askForInput(key: keyof T): Promise<void> {
    const option = options[key];

    const value = await vscode.window.showInputBox({
      prompt: option.prompt,
      title: option.title + (option.required ? '*' : ''),
      value: option.default,
      validateInput: (value) => {
        if (option.required && !value) {
          return 'This field is required';
        }

        if (option.type === 'number' && isNaN(Number(value))) {
          return 'This field must be a number';
        }

        if (option.type === 'boolean' && !['true', 'false'].includes(value)) {
          return 'This field must be a boolean';
        }

        return null;
      }
    });

    return new Promise((resolve, reject) => {
      if (value === undefined && option.required) {
        return reject();
      }

      if (option.type === 'boolean') {
        result[key] = (value === 'true') as any;
      } else {
        result[key] = value as any;
      }
      resolve();
    });
  }

  for (const key of keys) {
    try {
      await askForInput(key);
    } catch (error) {
      return new Error('Input is required');
    }
  }

  return result as Result<T>;
}