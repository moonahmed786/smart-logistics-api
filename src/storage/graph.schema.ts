import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { NodeId } from '../domain/types';

export type GraphDocument = HydratedDocument<GraphModel>;

@Schema({ collection: 'graphs', versionKey: false })
export class GraphModel {
  @Prop({ type: String, required: true, unique: true, index: true })
  graphId!: string;

  @Prop({ type: Date, required: true, index: true })
  createdAt!: Date;

  @Prop({ type: [String], required: true })
  nodes!: NodeId[];

  @Prop({ type: Object, required: true })
  adjacency!: Record<NodeId, Array<{ from: NodeId; to: NodeId; cost: number; durationMinutes?: number; tags?: string[] }>>;
}

export const GraphSchema = SchemaFactory.createForClass(GraphModel);
