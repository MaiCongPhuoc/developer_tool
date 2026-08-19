import {
  type TypedUseSelectorHook,
  useDispatch,
  useSelector,
} from 'react-redux';
import type { AppDispatch, RootState } from '.';

// Sử dụng 2 hooks này trong suốt dự án thay cho useDispatch và useSelector mặc định
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
