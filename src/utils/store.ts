import { create } from 'zustand';

interface State {
  ip: number | undefined;
  set_ip: (ip: number) => void;
  current_state: number;
  set_current_state: (current_state: number) => void;
  current_fortifier: number | undefined;
  set_current_fortifier: (current_fortifier: number) => void;
  current_fortified: number | undefined;
  set_current_fortified: (current_fortified: number) => void;
}

export const useElementStore = create<State>((set) => ({
  ip: undefined,
  set_ip: (ip: number) => set(() => ({ ip })),
  current_state: 1,
  set_current_state: (current_state: number) => set(() => ({ current_state })),
  current_fortifier: undefined,
  set_current_fortifier: (current_fortifier: number) => set(() => ({ current_fortifier })),
  current_fortified: undefined,
  set_current_fortified: (current_fortified: number) => set(() => ({ current_fortified })),
}));
