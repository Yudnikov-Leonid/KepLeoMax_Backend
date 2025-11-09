const convertUserToSend = (user) => {
    if (!user) return null;

    return {id: user.id, email: user.email, username: user.username};
};

export default convertUserToSend;