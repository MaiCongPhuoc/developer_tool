import { UserProfile } from "./components/UserProfile";
import { useAppSelector } from "./store/hooks";

export const App: React.FC = () => {
  // Component Cha trực tiếp kết nối Redux Store
  // Và chỉ cho phép CHÍNH NÓ re-render khi age > 25
  const age = useAppSelector(
    (state) => state.user.age,
    (previousAge, currentAge) => {
      // Nếu age <= 25: Ép trả về true -> Chặn App re-render
      if (currentAge <= 25) {
        return true;
      }
      // Khi age > 25: So sánh giá trị bình thường
      return previousAge === currentAge;
    }
  );
  console.log("--> Component CHA (UserProfile) đã Render!");

  return (
    <section id="center">
      <div>
        <UserProfile />
        <h1>Get started</h1>
        <p>Tuổi được lắng nghe ở App: {age}</p>
      </div>
    </section>
  );
};

export default App;
