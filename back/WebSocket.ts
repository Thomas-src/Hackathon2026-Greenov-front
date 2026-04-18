import * as signalR from "@microsoft/signalr";
import { BACKEND_URL } from "@/utils/constants";

class QuizSocket {
	private connection: signalR.HubConnection | null = null;

	// ─────────────────────────────
	// CONNECTION
	// ─────────────────────────────

	async connect() {
		if (this.isConnected()) return;

		this.connection = new signalR.HubConnectionBuilder()
			.withUrl(`${BACKEND_URL}/hub`)
			.withAutomaticReconnect()
			.build();

		this.registerHandlers();

		await this.connection.start();
	}

	isConnected() {
		return this.connection?.state === signalR.HubConnectionState.Connected;
	}

	private ensureConnection() {
		if (!this.connection || !this.isConnected()) {
			throw new Error("SignalR not connected");
		}
		return this.connection;
	}

	// ─────────────────────────────
	// EVENTS REGISTRATION
	// ─────────────────────────────

	private registerHandlers() {
		if (!this.connection) return;

		this.connection.on("PlayerJoined", (data) => {
			console.log("PlayerJoined", data);
		});

		this.connection.on("GameStarted", (data) => {
			console.log("GameStarted", data);
		});

		this.connection.on("NewEvent", (data) => {
			console.log("NewEvent", data);
		});

		this.connection.on("WaitingForOthers", (data) => {
			console.log("WaitingForOthers", data);
		});

		this.connection.on("TimerTick", (data) => {
			console.log("TimerTick", data);
		});

		this.connection.on("ActionFeedback", (data) => {
			console.log("ActionFeedback", data);
		});

		this.connection.on("VillageUpdate", (data) => {
			console.log("VillageUpdate", data);
		});

		this.connection.on("Debrief", (data) => {
			console.log("Debrief", data);
		});

		this.connection.on("GlobalDebrief", (data) => {
			console.log("GlobalDebrief", data);
		});
	}

	// ─────────────────────────────
	// ROOM (HOST / PLAYER)
	// ─────────────────────────────

	async createRoom(duration: number): Promise<string> {
		return await this.ensureConnection().invoke("CreateRoom", duration);
	}

	async joinRoom(roomId: string, username: string, profile: string) {
		await this.ensureConnection().invoke("JoinRoom", roomId, username, profile);
	}

	async startGame(roomId: string) {
		await this.ensureConnection().invoke("StartGame", roomId);
	}

	async forceEnd(roomId: string) {
		await this.ensureConnection().invoke("ForceEndGame", roomId);
	}

	// ─────────────────────────────
	// GAME ACTIONS
	// ─────────────────────────────

	async submitAction(roomId: string, actionId: string) {
		await this.ensureConnection().invoke("SubmitAction", roomId, actionId);
	}

	async getDebrief(roomId: string) {
		await this.ensureConnection().invoke("GetMyDebrief", roomId);
	}

	async getGlobalDebrief(roomId: string) {
		await this.ensureConnection().invoke("GetGlobalDebrief", roomId);
	}

	on<T>(event: string, cb: (data: T) => void) {
		this.connection?.on(event, cb);
	}

	// ─────────────────────────────
	// CLEANUP
	// ─────────────────────────────

	async disconnect() {
		await this.connection?.stop();
		this.connection = null;
	}
}

export const quizSocket = new QuizSocket();