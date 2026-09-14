import { useCallback, useRef, useState } from "react";

type ControllableStateOptions<T> = {
  prop: T | undefined;
  defaultProp: T;
  onChange?: (value: T) => void;
};

export function useControllableState<T>({
  prop,
  defaultProp,
  onChange,
}: ControllableStateOptions<T>): [T, (next: T) => void] {
  const [uncontrolled, setUncontrolled] = useState(defaultProp);
  const isControlled = prop !== undefined;
  const value = isControlled ? prop : uncontrolled;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next);
      if (next !== value) onChangeRef.current?.(next);
    },
    [isControlled, value],
  );

  return [value, setValue];
}
