// socket.js
const Postmodel = require('./models/Postmodel');
const responsemodel = require('./models/Responsemodel');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('Connected');

    socket.on('new_post', (formdata) => {
      const postData = {
        title: formdata.title,
        content: formdata.content,
        postimage: formdata.filename,
        _id: formdata._id,
        views: formdata.views,
        createdat: formdata.created_At,
        admin: formdata.admin,
      };
      socket.broadcast.emit('new_post', postData);
    });

    socket.on('delete_post', (postId) => {
      socket.broadcast.emit('delete_post', postId);
    });

    socket.on('newComment', (comment) => {
      io.emit('newComment', comment);
    });

    socket.on('Commentdeleted', (commentid) => {
      io.emit('Commentdeleted', commentid);
    });

    socket.on('newreply', (reply) => {
      io.emit('newreply', reply);
    });

    socket.on('incview', async (postid) => {
      await Postmodel.updateOne({ _id: postid }, { $inc: { views: 1 } });
      const data = await Postmodel.find({ _id: postid });
      socket.broadcast.emit('updateviews', data);
    });

    socket.on('like', async (data) => {
      await responsemodel.updateOne(
        { postId: data.postid, email: data.email },
        { type: 1 },
        { upsert: true }
      );

      const likes = await responsemodel.countDocuments({
        postId: data.postid,
        type: 1,
      });
      const dislikes = await responsemodel.countDocuments({
        postId: data.postid,
        type: 0,
      });

      io.emit('like_dislike', {
        postid: data.postid,
        likes: likes,
        dislikes: dislikes,
      });
    });

    socket.on('dislike', async (data) => {
      await responsemodel.updateOne(
        { postId: data.postid, email: data.email },
        { type: 0 },
        { upsert: true }
      );

      const likes = await responsemodel.countDocuments({
        postId: data.postid,
        type: 1,
      });
      const dislikes = await responsemodel.countDocuments({
        postId: data.postid,
        type: 0,
      });
      io.emit('like_dislike', {
        postid: data.postid,
        likes: likes,
        dislikes: dislikes,
      });
    });
  });
};
