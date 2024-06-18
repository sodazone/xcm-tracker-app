import "./App.css";
import { SelectSubscription } from "./components/SelectSubscription";
import { SubscriptionStreams } from "./components/SubscriptionStreams";
import { OcelloidsContextProvider } from "./context/OcelloidsContext";

function App() {
  return (
    <OcelloidsContextProvider>
      <main className="font-noto text-white h-screen max-w-7xl mx-auto z-10">
        <SelectSubscription />
        <SubscriptionStreams />
      </main>
    </OcelloidsContextProvider>
  );
}

export default App;
