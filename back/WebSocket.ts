import * as signalR from "@microsoft/signalr";
import {BACKEND_URL} from "@/utils/constants";
import type {JoinFailed, JoinSuccess, QuizHubServerEvents, RoomCreated,} from "@/back/types/socket.t";

type Handler<K extends keyof QuizHubServerEvents> = (data: QuizHubServerEvents[K]) => void;

// Events à bufferiser — ceux qui peuvent arriver pendant une transition de page
const BUFFERED_EVENTS: (keyof QuizHubServerEvents)[] = [
    "GameStartedPlayer",
    "GameStartedHost",
    "NewEvent",
    "WaitingForOthers",
    "Debrief",
    "GlobalDebrief",
];

class QuizSocket {
    private connection: signalR.HubConnection | null = null;
    private connectPromise: Promise<void> | null = null;

    private handlers = new Map<keyof QuizHubServerEvents, Handler<any>>();

    // Buffer : stocke le dernier event reçu pour chaque event bufferisé
    // Rejoué immédiatement quand un handler s'enregistre via on()
    private buffer = new Map<keyof QuizHubServerEvents, any>();

    // ─────────────────────────────
    // CONNECTION
    // ─────────────────────────────
    private readonly knownEvents: (keyof QuizHubServerEvents)[] = [
        "RoomCreated",
        "JoinSuccess",
        "JoinFailed",
        "PlayerJoined",
        "PlayerLeft",
        "GameStartedHost",
        "GameStartedPlayer",
        "NewEvent",
        "WaitingForOthers",
        "TimerTick",
        "ActionFeedback",
        "VillageUpdate",
        "Debrief",
        "GlobalDebrief",
    ];

    async connect(): Promise<void> {
        if (this.isConnected()) return;
        if (this.connectPromise) return this.connectPromise;

        this.connectPromise = this._doConnect().finally(() => {
            this.connectPromise = null;
        });

        return this.connectPromise;
    }

    isConnected(): boolean {
        return this.connection?.state === signalR.HubConnectionState.Connected;
    }

    on<K extends keyof QuizHubServerEvents>(
        event: K,
        cb: (data: QuizHubServerEvents[K]) => void
    ): void {
        this.handlers.set(event, cb as Handler<any>);

        // Replay immédiat si l'event était déjà arrivé avant l'enregistrement
        if (BUFFERED_EVENTS.includes(event) && this.buffer.has(event)) {
            console.debug(`[SignalR ↺] replay ${event}`);
            cb(this.buffer.get(event));
        }
    }

    // ─────────────────────────────
    // BINDING INTERNE
    // ─────────────────────────────

    off<K extends keyof QuizHubServerEvents>(event: K): void {
        this.handlers.delete(event);
    }

    // Vide le buffer d'un event une fois qu'il a été traité définitivement
    clearBuffer<K extends keyof QuizHubServerEvents>(event: K): void {
        this.buffer.delete(event);
    }

    // Vide tout le buffer (ex: fin de partie, retour au lobby)
    clearAllBuffers(): void {
        this.buffer.clear();
    }

    // ─────────────────────────────
    // EVENT SUBSCRIPTIONS
    // Si un event bufferisé est déjà arrivé, le handler est appelé immédiatement.
    // ─────────────────────────────

    async createRoom(durationMinutes: number): Promise<RoomCreated> {
        await this.connect();

        return new Promise<RoomCreated>((resolve, reject) => {
            const conn = this.ensureConnection();

            this.handlers.set("RoomCreated", (data: RoomCreated) => {
                this.handlers.delete("RoomCreated");
                resolve(data);
            });

            conn.invoke("CreateRoom", durationMinutes).catch((err: unknown) => {
                this.handlers.delete("RoomCreated");
                reject(err);
            });
        });
    }

    async startGame(roomId: string): Promise<void> {
        await this.connect();
        await this.ensureConnection().invoke("StartGame", roomId);
    }

    async forceEnd(roomId: string): Promise<void> {
        await this.connect();
        await this.ensureConnection().invoke("ForceEndGame", roomId);
    }

    async joinRoom(roomId: string, username: string, profile: string): Promise<JoinSuccess> {
        await this.connect();

        return new Promise<JoinSuccess>((resolve, reject) => {
            const conn = this.ensureConnection();

            const cleanup = () => {
                this.handlers.delete("JoinSuccess");
                this.handlers.delete("JoinFailed");
            };

            this.handlers.set("JoinSuccess", (data: JoinSuccess) => {
                cleanup();
                resolve(data);
            });

            this.handlers.set("JoinFailed", (data: JoinFailed) => {
                cleanup();
                reject(new Error(data.message));
            });

            conn.invoke("JoinRoom", roomId, username, profile).catch((err: unknown) => {
                cleanup();
                reject(err);
            });
        });
    }

    // ─────────────────────────────
    // ROOM (HOST)
    // ─────────────────────────────

    async submitAction(roomId: string, actionId: string): Promise<void> {
        await this.connect();
        await this.ensureConnection().invoke("SubmitAction", roomId, actionId);
    }

    async getMyDebrief(roomId: string): Promise<void> {
        await this.connect();
        await this.ensureConnection().invoke("GetMyDebrief", roomId);
    }

    async disconnect(): Promise<void> {
        this.handlers.clear();
        this.buffer.clear();
        await this.connection?.stop();
        this.connection = null;
    }

    // ─────────────────────────────
    // ROOM (PLAYER)
    // ─────────────────────────────

    private async _doConnect(): Promise<void> {
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(`${BACKEND_URL}/hub`)
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        this.connection.onreconnected(() => {
            this.rebindAll();
        });

        this.bindAll();
        await this.connection.start();
    }

    // ─────────────────────────────
    // GAME ACTIONS
    // ─────────────────────────────

    private ensureConnection(): signalR.HubConnection {
        if (!this.connection || !this.isConnected()) {
            throw new Error("SignalR not connected");
        }
        return this.connection;
    }

    private bindAll(): void {
        if (!this.connection) return;
        for (const event of this.knownEvents) {
            this.connection.on(event, (data) => {
                console.debug(`[SignalR ←] ${event}`, data);

                // Bufferise si c'est un event critique
                if (BUFFERED_EVENTS.includes(event)) {
                    this.buffer.set(event, data);
                }

                this.handlers.get(event)?.(data);
            });
        }
    }

    // ─────────────────────────────
    // CLEANUP
    // ─────────────────────────────

    private rebindAll(): void {
        if (!this.connection) return;
        for (const event of this.knownEvents) {
            this.connection.off(event);
        }
        this.bindAll();
    }
}

export const quizSocket = new QuizSocket();