import * as signalR from "@microsoft/signalr";

class QuizSocket {
	private connection: signalR.HubConnection | null = null;

	async connect() {
		if (this.connection?.state === signalR.HubConnectionState.Connected) {
			return;
		}

		this.connection = new signalR.HubConnectionBuilder()
			.withUrl("http://localhost:5275/hub")
			.withAutomaticReconnect()
			.build();

		this.connection.on("PlayerJoined", (username) => {
			console.log("Player joined:", username);
		});

		this.connection.on("NewQuestion", (question) => {
			console.log("Question:", question);
		});

		this.connection.on("ActionFeedback", (data) => {
			console.log("Feedback:", data);
		});

		this.connection.on("VillageUpdate", (data) => {
			console.log("Village:", data);
		});

		await this.connection.start();
	}

	async createRoom(): Promise<string> {
		if (!this.connection) throw new Error("Not connected");

		return await this.connection.invoke("CreateRoom");
	}

	async joinRoom(roomId: string, username: string) {
		return await this.connection?.invoke("JoinRoom", roomId, username);
	}

	async sendQuestion(roomId: string, question: string) {
		return await this.connection?.invoke("SendQuestion", roomId, question);
	}

	async sendEvent(roomId: string, eventId: string) {
		return await this.connection?.invoke("SendEvent", roomId, eventId);
	}

	async submitAction(roomId: string, actionId: string) {
		return await this.connection?.invoke("SubmitAction", roomId, actionId);
	}

	async getDebrief(roomId: string) {
		return await this.connection?.invoke("GetMyDebrief", roomId);
	}

	isConnected() {
		return this.connection?.state === signalR.HubConnectionState.Connected;
	}
}

export const quizSocket = new QuizSocket();