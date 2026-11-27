const AUDIO_BASE_PATH = `${import.meta.env.BASE_URL}audio`;
const AUDIO_EXTENSIONS = ["mp3", "wav"] as const;

type AudioKind = "sfx" | "bgm";

function normalizeAudioName(name: string): string | null {
    const normalized = name.replaceAll("\\", "/").replace(/^\/+|\/+$/g, "");
    if (!normalized || normalized.split("/").some(part => !part || part === "." || part === "..")) {
        return null;
    }
    return normalized;
}

function getAudioSources(kind: AudioKind, name: string): string[] {
    const normalized = normalizeAudioName(name);
    if (!normalized) return [];

    const extension = /\.(mp3|wav)$/i.exec(normalized)?.[1].toLowerCase();
    const baseName = extension ? normalized.slice(0, -(extension.length + 1)) : normalized;
    const extensions = extension
        ? [extension]
        : [...AUDIO_EXTENSIONS].sort((left, right) => {
            const audio = new Audio();
            const leftSupported = audio.canPlayType(`audio/${left === "mp3" ? "mpeg" : "wav"}`) !== "";
            const rightSupported = audio.canPlayType(`audio/${right === "mp3" ? "mpeg" : "wav"}`) !== "";
            return Number(rightSupported) - Number(leftSupported);
        });

    return extensions.map(ext => `${AUDIO_BASE_PATH}/${kind}/${baseName}.${ext}`);
}

/** Plays audio files stored under public/audio. */
export class AudioManager {
    private readonly activeSoundEffects = new Set<HTMLAudioElement>();
    private bgm: HTMLAudioElement | null = null;
    private bgmName: string | null = null;

    /** Plays an effect. Each call gets its own audio element, so effects can overlap. */
    public playSoundEffect(name: string): void {
        const sources = getAudioSources("sfx", name);
        if (sources.length === 0) return;

        const audio = new Audio();
        audio.preload = "auto";
        this.activeSoundEffects.add(audio);
        this.playWithFallback(audio, sources, () => this.activeSoundEffects.delete(audio));
    }

    /** Starts looping background music, replacing any currently playing track. */
    public playBgm(name: string): void {
        if (this.bgmName === name && this.bgm) return;

        this.stopBgm();
        const sources = getAudioSources("bgm", name);
        if (sources.length === 0) return;

        const audio = new Audio();
        audio.loop = true;
        audio.preload = "auto";
        this.bgm = audio;
        this.bgmName = name;
        this.playWithFallback(audio, sources, () => {
            if (this.bgm === audio) {
                this.bgm = null;
                this.bgmName = null;
            }
        });
    }

    /** Stops the current background music. */
    public stopBgm(): void {
        if (!this.bgm) return;
        this.bgm.pause();
        this.bgm.removeAttribute("src");
        this.bgm.load();
        this.bgm = null;
        this.bgmName = null;
    }

    public dispose(): void {
        this.stopBgm();
        for (const audio of this.activeSoundEffects) {
            audio.pause();
            audio.removeAttribute("src");
            audio.load();
        }
        this.activeSoundEffects.clear();
    }

    private playWithFallback(
        audio: HTMLAudioElement,
        sources: string[],
        onError: () => void,
    ): void {
        let sourceIndex = 0;
        let finished = false;
        const finish = (): void => {
            if (finished) return;
            finished = true;
            audio.removeEventListener("error", tryNextSource);
            audio.removeEventListener("ended", finish);
            onError();
        };
        const tryNextSource = (): void => {
            if (sourceIndex >= sources.length) {
                finish();
                return;
            }
            audio.src = sources[sourceIndex++];
            void audio.play().catch(() => {
                // A rejected play() is not necessarily a missing or unsupported file.
                if (!audio.error) finish();
            });
        };

        audio.addEventListener("error", tryNextSource);
        audio.addEventListener("ended", finish, { once: true });
        tryNextSource();
    }
}
