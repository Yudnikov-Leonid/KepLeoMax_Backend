import bcrypt from 'bcrypt';

var users = [];

export const createNewUser = async (req, res) => {
    const {email, password} = req.body;
    if (!email || !password) {
        const error = Error('Email and password are required');
        error.status = 400;
        throw error;
    }

    // check duplicates
    const duplicate = users.find(person => person.email === email);
    if (duplicate) {
        const error = Error(`User with email ${email} is alredy exists`);
        error.status = 409;
        throw error;
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {email: email, password: hashedPassword};
        users.push(newUser);

        console.log(`New users list: ${users.map(person => `${person.email} ${person.password}`)}`);
        res.status(201).json({success: `New user ${email} created`});
    } catch (err) {
        const error = Error(err.message);
        error.status = 500;
        throw error;
    }
}

export const login = async (req, res) => {
    const {email, password} = req.body;
    if (!email || !password) {
        return res.status(400).json({message: 'Email and password are required'});
    }

    const foundUser = users.find(person => person.email === email);
    if (!foundUser) return res.status(401).json({message: `User with email ${email} was not found`});

    const match = await bcrypt.compare(password, foundUser.password);
    if (match) {
        res.json({success: `User ${email} is logged in!`});
    } else {
        res.status(401).json({message: 'Password is incorrect'});
    }
}