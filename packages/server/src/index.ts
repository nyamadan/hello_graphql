import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import { loadSchemaSync } from "@graphql-tools/load";
import { addResolversToSchema } from "@graphql-tools/schema";
import { Prisma, PrismaClient } from "@prisma/client";
import path from "path";
import { ulid } from "ulid";
import {
  MutationResolvers,
  QueryResolvers,
  Resolvers,
  Todo,
} from "./types/generated/graphql";
const prisma = new PrismaClient();

const addTodo: MutationResolvers["addTodo"] = async (_, { text }) => {
  const data: Prisma.TodoUncheckedCreateInput = {
    id: ulid(),
    text,
  };

  const todo = await prisma.todo.create({ data });
  return {
    ...todo,
    status: todo.status as Todo["status"],
    createdAt: todo.createdAt.toISOString(),
  };
};

const getTodo: QueryResolvers["getTodo"] = async (...args) => {
  const [_, { id }] = args;

  const todo = await prisma.todo.findUnique({
    where: {
      id,
    },
  });

  if (todo == null) {
    return null;
  }

  return {
    ...todo,
    status: todo.status as Todo["status"],
    createdAt: todo.createdAt.toISOString(),
  };
};

const getTodoList: QueryResolvers["getTodoList"] = async () => {
  const result = await prisma.todo.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  return result.map<Todo>((todo) => ({
    ...todo,
    status: todo.status as Todo["status"],
    createdAt: todo.createdAt.toISOString(),
  }));
};

const resolvers: Resolvers = {
  Query: {
    getTodo,
    getTodoList,
  },
  Mutation: {
    addTodo,
  },
};

const schema = addResolversToSchema({
  schema: loadSchemaSync(path.join(__dirname, "../schema.graphql"), {
    loaders: [new GraphQLFileLoader()],
  }),
  resolvers,
});

const server = new ApolloServer({
  schema,
});

startStandaloneServer(server, {
  listen: { port: 4000 },
}).then(({ url }) => {
  console.log(`🚀  Server ready at: ${url}`);
});
