import ShoppingList from "../islands/ShoppingList.tsx";

export default function Home() {
  return (
    <div class="min-h-screen bg-gradient-to-br from-red-400 via-yellow-400 via-cyan-400 via-pink-400 to-blue-400 bg-[length:400%_400%] animate-gradient">
      <header class="text-center py-8">
        <h1 class="text-4xl md:text-5xl font-bold text-white drop-shadow-lg animate-bounce">
          🎉 Party Einkaufsliste 🎊
        </h1>
        <p class="text-white/80 mt-2 text-lg">
          Gemeinsam planen, gemeinsam feiern! 🥳
        </p>
      </header>
      <ShoppingList />
    </div>
  );
}
