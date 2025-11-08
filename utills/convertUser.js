const convertUserToSend = (user) => ({id: user.id, email: user.email, username: user.username});

export default convertUserToSend;