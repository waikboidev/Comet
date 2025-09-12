import { Schema, model } from 'mongoose';

const exampleSchema = new Schema({
  guildId: {
    type: String,
    required: true,
    unique: true,
  },
  prefix: {
    type: String,
    default: '!',
  },
});

export const ExampleModel = model('Example', exampleSchema);
