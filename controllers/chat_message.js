import { ChatMessage } from "../models/index.js";
import { io, getFilePath } from "../utils/index.js";


async function sendText(req, res) {
    const { chat_id, message } = req.body;
    const { user_id } = req.user;
  
    try {
      const chat_message = new ChatMessage({
        chat: chat_id,
        user: user_id,
        message,
        type: "TEXT",
      });
  
      // Guarda el mensaje sin usar callback
      await chat_message.save();
  
      // Realiza el populate en la propiedad "user"
      const data = await chat_message.populate("user");
  
      // Emite los eventos a los sockets correspondientes
      io.sockets.in(chat_id).emit("message", data);
      io.sockets.in(`${chat_id}_notify`).emit("message_notify", data);
  
      res.status(201).send({});
    } catch (error) {
      res.status(400).send({ msg: "Error al enviar el mensaje" });
    }
  }
  


  async function sendImage(req, res) {
    const { chat_id } = req.body;
    const { user_id } = req.user;
  
    try {
      const chat_message = new ChatMessage({
        chat: chat_id,
        user: user_id,
        message: getFilePath(req.files.image), // Aquí usas la URL de la imagen como el mensaje
        type: "IMAGE",
      });
  
      // Usa `await` en lugar de un callback
      await chat_message.save();
  
      // Realiza el populate de la propiedad "user"
      const data = await chat_message.populate("user");
  
      // Emite los eventos a los sockets correspondientes
      io.sockets.in(chat_id).emit("message", data);
      io.sockets.in(`${chat_id}_notify`).emit("message_notify", data);
  
      res.status(201).send({});
    } catch (error) {
      res.status(400).send({ msg: "Error al enviar la imagen" });
    }
  }

  async function getAll(req, res) {
    const { chat_id } = req.params;
  
    try {
      const messages = await ChatMessage.find({ chat: chat_id })
        .sort({
          createdAt: 1,
        })
        .populate("user");
  
      const total = await ChatMessage.find({ chat: chat_id }).countDocuments();
  
      res.status(200).send({ messages, total });
    } catch (error) {
      res.status(500).send({ msg: "Error del servidor" });
    }
  }
  

  async function getTotalMessages(req, res) {
    const { chat_id } = req.params;
  
    try {
      const response = await ChatMessage.find({ chat: chat_id }).countDocuments();
      res.status(200).send(JSON.stringify(response));
    } catch (error) {
      res.status(500).send({ msg: "Error del servidor" });
    }
  }

  async function getLastMessage(req, res) {
    const { chat_id } = req.params;
  
    try {
      const response = await ChatMessage.findOne({ chat: chat_id }).sort({
        createdAt: -1,
      });
      res.status(200).send(response || {});
    } catch (error) {
      res.status(500).send({ msg: "Error del servidor" });
    }
  }
  

  export const ChatMessageController = {
    sendText,
    sendImage,
    getAll,
    getTotalMessages,
    getLastMessage,
  };
  
  