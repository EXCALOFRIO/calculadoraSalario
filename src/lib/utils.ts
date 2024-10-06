// src/lib/utils.ts
import clsx from 'clsx';

export const cn = (...inputs: ClassValue[]) => {
  return clsx(inputs);
};

export type ClassValue =
| string
| number
| boolean
| undefined
| null
| ClassArray
| ClassDictionary
| ClassValue[];

export type ClassDictionary = Record<string, any>; // Or a more specific type if you know what your class keys will be

export type ClassArray = ClassValue[];