import type { UserState } from '@/util/interface/UserState';

export const calculateIncrementAge = (state: UserState) => {
  state.age += 1;
};
