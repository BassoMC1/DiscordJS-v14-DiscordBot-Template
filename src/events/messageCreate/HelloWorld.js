module.exports = {
	name: 'messageCreate',
	async execute(message) {
        console.log(`Received message: ${message.content}`);
        if(message.content === "!Hello") {
            message.reply("world!")
        }
	},
};