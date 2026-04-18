import * as signalR from "@microsoft/signalr";
import {BACKEND_URL} from "@/utils/constants";
import type {JoinFailed, JoinSuccess, QuizHubServerEvents, RoomCreated,} from "@/back/types/socket.t";

class QuizSocket {
    private connection: signalR.HubConnection | null = null;

    // ─────────────────────────────
    // CONNECTION
    // ─────────────────────────────

    async connect(): Promise<void> {
        if (this.isConnected()) return;

        if (this.connection?.state === signalR.HubConnectionState.Connecting) {
            await new Promise<void>((resolve) => {
                const interval = setInterval(() => {
                    if (this.isConnected()) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 50);
            });
            return;
        }

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(`${BACKEND_URL}/hub`)
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Information)
            .build();

        await this.connection.start();

        this.registerHandlers();
    }

    isConnected(): boolean {
        return this.connection?.state === signalR.HubConnectionState.Connected;
    }

    private ensureConnection(): signalR.HubConnection {
        if (!this.connection || !this.isConnected()) {
            throw new Error("SignalR not connected");
        }
        return this.connection;
    }

    // ─────────────────────────────
    // EVENTS REGISTRATION
    // ─────────────────────────────

    private registerHandlers(): void {
        if (!this.connection) return;

        const events: (keyof QuizHubServerEvents)[] = [
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

        for (const event of events) {
            this.connection.on(event, (data) => {
                console.log(`[SignalR] ${event}`, data);
            });
        }

        this.connection.onclose(() => {
            console.log("[SignalR] Disconnected");
        });

        this.connection.onreconnecting(() => {
            console.log("[SignalR] Reconnecting...");
        });

        this.connection.onreconnected(() => {
            console.log("[SignalR] Reconnected");
            this.registerHandlers(); // 👈 ré-attache après reconnect
        });
    }

    // ─────────────────────────────
    // ROOM (HOST)
    // ─────────────────────────────

    async createRoom(durationMinutes: number): Promise<RoomCreated> {
        await this.connect();

        return new Promise<RoomCreated>((resolve, reject) => {
            const conn = this.ensureConnection();

            const onCreated = (data: RoomCreated) => {
                conn.off("RoomCreated", onCreated);
                resolve(data);
            };

            conn.on("RoomCreated", onCreated);

            conn.invoke("CreateRoom", durationMinutes).catch((err: unknown) => {
                conn.off("RoomCreated", onCreated);
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

    // ─────────────────────────────
    // ROOM (PLAYER)
    // ─────────────────────────────

    async joinRoom(roomId: string, username: string, profile: string): Promise<JoinSuccess> {
        await this.connect();

        return new Promise<JoinSuccess>((resolve, reject) => {
            const conn = this.ensureConnection();

            const onSuccess = (data: JoinSuccess) => {
                conn.off("JoinSuccess", onSuccess);
                conn.off("JoinFailed", onFailed);
                resolve(data);
            };

            const onFailed = (data: JoinFailed) => {
                conn.off("JoinSuccess", onSuccess);
                conn.off("JoinFailed", onFailed);
                reject(new Error(data.message));
            };

            conn.on("JoinSuccess", onSuccess);
            conn.on("JoinFailed", onFailed);

            conn.invoke("JoinRoom", roomId, username, profile).catch((err: unknown) => {
                conn.off("JoinSuccess", onSuccess);
                conn.off("JoinFailed", onFailed);
                reject(err);
            });
        });
    }

    // ─────────────────────────────
    // GAME ACTIONS
    // ─────────────────────────────

    async submitAction(roomId: string, actionId: string): Promise<void> {
        await this.connect();
        await this.ensureConnection().invoke("SubmitAction", roomId, actionId);
    }

    async getMyDebrief(roomId: string): Promise<void> {
        await this.connect();
        await this.ensureConnection().invoke("GetMyDebrief", roomId);
    }

    // ─────────────────────────────
    // EVENT SUBSCRIPTIONS
    // ─────────────────────────────

    on<K extends keyof QuizHubServerEvents>(
        event: K,
        cb: (data: QuizHubServerEvents[K]) => void
    ): void {
        this.connection?.on(event, cb);
    }

    off<K extends keyof QuizHubServerEvents>(event: K): void {
        this.connection?.off(event);
    }

    // ─────────────────────────────
    // CLEANUP
    // ─────────────────────────────

    async disconnect(): Promise<void> {
        await this.connection?.stop();
        this.connection = null;
    }
}

export const quizSocket = new QuizSocket();