type TitleScreenOptions = {
    app: HTMLDivElement;
    onStart: () => void;
};

export function showTitleScreen({ app, onStart }: TitleScreenOptions): void {
    // 背景
    const overlay = document.createElement("div");
    Object.assign(overlay.style, {
        position: "absolute",
        inset: "0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background:
            "radial-gradient(circle at top, rgba(255, 239, 153, 0.42), transparent 42%), radial-gradient(circle at 18% 20%, rgba(164, 221, 130, 0.34), transparent 38%), linear-gradient(155deg, #f7f6d8 0%, #def1be 44%, #b8db8c 100%)",
    } satisfies Partial<CSSStyleDeclaration>);

    const panel = document.createElement("div");
    Object.assign(panel.style, {
        width: "min(520px, 100%)",
        padding: "40px 32px",
        border: "1px solid rgba(247, 241, 192, 0.34)",
        borderRadius: "28px",
        background:
            "linear-gradient(180deg, rgba(127, 155, 76, 0.9) 0%, rgba(92, 117, 49, 0.94) 100%)",
        boxShadow: "0 24px 70px rgba(63, 82, 28, 0.28)",
        backdropFilter: "blur(14px)",
        textAlign: "center",
        color: "#fffbea",
    } satisfies Partial<CSSStyleDeclaration>);

    const title = document.createElement("h1");
    title.textContent = "タイトル";
    Object.assign(title.style, {
        margin: "0",
        fontSize: "clamp(42px, 9vw, 76px)",
        letterSpacing: "0.06em",
        lineHeight: "0.92",
    } satisfies Partial<CSSStyleDeclaration>);

    const description = document.createElement("p");
    description.textContent = "Enter またはボタンでゲームを開始";
    Object.assign(description.style, {
        margin: "18px 0 28px",
        fontSize: "16px",
        lineHeight: "1.7",
        color: "rgba(255, 246, 220, 0.86)",
    } satisfies Partial<CSSStyleDeclaration>);

    const startButton = document.createElement("button");
    startButton.type = "button";
    startButton.textContent = "スタート";
    Object.assign(startButton.style, {
        minWidth: "220px",
        padding: "16px 28px",
        border: "0",
        borderRadius: "999px",
        background: "linear-gradient(135deg, #ff6b6b 0%, #ff9950 100%)",
        color: "#fffdfa",
        fontSize: "18px",
        fontWeight: "700",
        letterSpacing: "0.08em",
        cursor: "pointer",
        boxShadow: "0 16px 36px rgba(255, 107, 107, 0.28)",
    } satisfies Partial<CSSStyleDeclaration>);
    startButton.addEventListener("mouseenter", () => {
        startButton.style.transform = "translateY(-1px) scale(1.01)";
    });
    startButton.addEventListener("mouseleave", () => {
        startButton.style.transform = "translateY(0) scale(1)";
    });

    let hasStarted = false;
    const startGame = () => {
        if (hasStarted) {
            return;
        }

        hasStarted = true;
        window.removeEventListener("keydown", onKeyDown);
        overlay.remove();
        onStart();
    };

    const onKeyDown = (event: KeyboardEvent) => {
        if (event.code !== "Enter" && event.code !== "NumpadEnter") {
            return;
        }

        event.preventDefault();
        startGame();
    };

    startButton.addEventListener("click", startGame);
    window.addEventListener("keydown", onKeyDown);

    panel.append(title, description, startButton);
    overlay.append(panel);
    app.append(overlay);
    startButton.focus();
}
