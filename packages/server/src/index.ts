import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import { loadSchemaSync } from "@graphql-tools/load";
import { addResolversToSchema } from "@graphql-tools/schema";
import { Prisma, PrismaClient, User } from "@prisma/client";
import path from "path";
import { ulid } from "ulid";
import {
  MutationResolvers,
  QueryResolvers,
  Resolvers,
} from "./types/generated/graphql";
const prisma = new PrismaClient();

const addUser: MutationResolvers["addUser"] = async (_, { name }) => {
  const data: Prisma.UserUncheckedCreateInput = {
    id: ulid(),
    name,
  };

  return await prisma.user.create({ data });
};

const addPost: MutationResolvers["addPost"] = async (_, { text, userId }) => {
  const data: Prisma.PostUncheckedCreateInput = {
    id: ulid(),
    userId,
    text,
  };

  return await prisma.post.create({ data });
};

const getUser: QueryResolvers["getUser"] = async (...args) => {
  const [_, { id }] = args;

  const result = await prisma.user.findUnique({
    where: {
      id,
    },
    include: {
      posts: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  return result;
};

const getPost: QueryResolvers["getPost"] = async (...args) => {
  const [_, { id }] = args;

  const result = await prisma.post.findUnique({
    where: {
      id,
    },
    include: {
      user: true,
    },
  });

  return result;
};

const resolvers: Resolvers = {
  Query: {
    getUser,
    getPost,
  },
  Mutation: {
    addUser,
    addPost,
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
