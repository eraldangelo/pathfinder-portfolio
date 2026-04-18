export const studentInfoModalAnimations = `
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
    @keyframes fade-in-scale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    .animate-fade-in-scale { animation: fade-in-scale 0.2s ease-out forwards; }
    @keyframes fade-out-scale { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.95); } }
    .animate-fade-out-scale { animation: fade-out-scale 0.2s ease-in forwards; }
    @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }
    .animate-fade-in-fast { animation: fade-in-fast 0.3s ease-out forwards; }
    @keyframes slide-in-left {
        from { opacity: 0.5; transform: translateX(30px); }
        to { opacity: 1; transform: translateX(0); }
    }
    .animate-slide-in-left { animation: slide-in-left 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
    @keyframes slide-in-right {
        from { opacity: 0.5; transform: translateX(-30px); }
        to { opacity: 1; transform: translateX(0); }
    }
    .animate-slide-in-right { animation: slide-in-right 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
`;
