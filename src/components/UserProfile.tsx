import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { incrementAge, updateName } from '@/store/slices/userSlice';
import React from 'react';

export const UserProfile: React.FC = () => {
  const dispatch = useAppDispatch();

  // Con lấy dữ liệu bình thường -> Luôn re-render mỗi khi bấm nút Tăng tuổi
  const user = useAppSelector((state) => state.user);

  console.log('--> Component CON (UserProfile) đã Render!');

  return (
    <div className="p-4 border rounded-md shadow-md">
      <h2 className="text-xl font-bold">Thông tin User</h2>
      <p>Tên: {user.name}</p>
      <p>Tuổi: {user.age}</p>

      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={() => dispatch(updateName('Nguyễn Văn A'))}
          className="px-3 py-1 bg-blue-500 text-white rounded"
        >
          Đổi tên
        </button>

        <button
          type="button"
          onClick={() => dispatch(incrementAge())}
          className="px-3 py-1 bg-green-500 text-white rounded"
        >
          Tăng tuổi
        </button>
      </div>
    </div>
  );
};
