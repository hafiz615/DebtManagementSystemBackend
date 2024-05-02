import {sign} from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {User} from '../../database/models/user.model';
import {UserRepository} from '../repository/user/user.repository';
import {IUser} from '../../database/interfaces/user.interface';
dotenv.config();
class TokenService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }
  create = async (userId: mongoose.Types.ObjectId): Promise<string> => {
    try {
      const accessToken = this.generateJwtToken(userId);
      return accessToken;
    } catch (err) {
      throw new Error('Something went wrong while creating token' + err);
    }
  };
  private generateJwtToken(userId: mongoose.Types.ObjectId): string {
    const payload = {
      userId: userId,
    };
    const token = sign(payload, String(process.env.jwtKey), {
      expiresIn: process.env.jwtExpire,
    });
    return token;
  }

  async validateToken(token: string, userId: string) {
    const user = await this.userRepository.getById<IUser>(userId, '+token');
    return user?.token === token ? user : null;
  }
}

export default TokenService;
