import { Chat, ChatMessage } from "../models/index.js";


async function create(req, res) { 
  const { participant_id_one, participant_id_two } = req.body;

  try {
    // Busca un chat existente en ambas direcciones de participantes
    const foundOne = await Chat.findOne({
      participant_one: participant_id_one,
      participant_two: participant_id_two,
    });

    const foundTwo = await Chat.findOne({
      participant_one: participant_id_two,
      participant_two: participant_id_one,
    });

    if (foundOne || foundTwo) {
      res.status(200).send({ msg: "Ya tienes un chat con este usuario" });
      return;
    }

    // Crea el nuevo chat y guarda sin callback usando await
    const chat = new Chat({
      participant_one: participant_id_one,
      participant_two: participant_id_two,
    });

    const chatStorage = await chat.save(); // Usando await aquí
    res.status(201).send(chatStorage);

  } catch (error) {
    res.status(400).send({ msg: "Error al crear el chat", error });
  }
}

async function getAll(req, res) {
  const { user_id } = req.user;

  try {
    // Realiza la búsqueda de los chats del usuario
    const chats = await Chat.find({
      $or: [{ participant_one: user_id }, { participant_two: user_id }],
    })
      .populate("participant_one")
      .populate("participant_two");

    const arrayChats = [];

    // Obtiene el último mensaje para cada chat
    for (const chat of chats) {
      const lastMessage = await ChatMessage.findOne({ chat: chat._id })
        .sort({ createdAt: -1 }); // Busca el último mensaje

      arrayChats.push({
        ...chat._doc,
        last_message_date: lastMessage?.createdAt || null,
      });
    }

    // Responde con los chats obtenidos
    res.status(200).send(arrayChats);
  } catch (error) {
    console.error(error); // Muestra detalles del error
    res.status(400).send({ msg: "Error al obtener los chats" });
  }
}


async function deleteChat(req, res) {
  const chat_id = req.params.id;

  try {
    const deletedChat = await Chat.findByIdAndDelete(chat_id);

    if (!deletedChat) {
      return res.status(404).send({ msg: "Chat no encontrado" });
    }

    res.status(200).send({ msg: "Chat eliminado" });
  } catch (error) {
    res.status(400).send({ msg: "Error al eliminar el chat" });
  }
}

async function getChat(req, res) {
  const chat_id = req.params.id;

  try {
    const chatStorage = await Chat.findById(chat_id)
      .populate("participant_one")
      .populate("participant_two");

    if (!chatStorage) {
      return res.status(404).send({ msg: "Chat no encontrado" });
    }

    res.status(200).send(chatStorage);
  } catch (error) {
    res.status(400).send({ msg: "Error al obtener el chat" });
  }
}



export const ChatController = {
  create,
  getAll,
  deleteChat,
  getChat,
};
