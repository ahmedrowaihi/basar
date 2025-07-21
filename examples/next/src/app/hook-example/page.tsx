import BasarHookExample from "../../components/BasarHookExample";

export default function HookExamplePage() {
  return (
    <div className="bg-gray-50 py-8 min-h-screen">
      <div className="bg-white shadow-lg mx-auto p-6 rounded-lg max-w-4xl">
        <h1 className="mb-6 font-bold text-3xl">🎣 useBasar Hook Example</h1>

        <div className="bg-blue-50 mb-6 p-4 rounded-lg">
          <h2 className="mb-2 font-semibold text-blue-900 text-xl">
            About the Hook
          </h2>
          <p className="text-blue-800">
            The <code className="bg-blue-100 px-1 rounded">useBasar</code> hook
            provides a simple way to integrate Basar detection into your React
            components. It handles the detection lifecycle and provides loading
            states, results, and error handling.
          </p>
        </div>

        <BasarHookExample />

        <div className="bg-yellow-50 mt-8 p-4 rounded-lg">
          <h3 className="mb-2 font-semibold text-lg">Hook Usage Example</h3>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
            {`import { useBasar } from "../hooks/useBasar";

const { result, isProcessing, error, detect } = useBasar(imageRef.current, {
  detectNSFW: true,
  detectGender: true,
  autoDetect: false, // We'll trigger manually
});

const handleImageLoad = async () => {
  if (imageRef.current) {
    await detect(imageRef.current);
  }
};`}
          </pre>
        </div>
      </div>
    </div>
  );
}
