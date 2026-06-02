import { INestApplication } from '@nestjs/common';
import { Request, Response } from 'express';
import { compare, hash } from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';

type SqlModule = typeof import('@adminjs/sql');

const ADMIN_ROOT_PATH = '/admin';
const TABLES = ['User', 'Project', 'Step', 'ProjectMember', 'Task'];
const TIMESTAMP_FIELDS_BY_TABLE: Record<string, string[]> = {
  User: ['createdAt', 'updatedAt'],
  Project: ['createdAt', 'updateAt'],
  Step: ['createdAt', 'updatedAt'],
  ProjectMember: ['createdAt'],
  Task: ['createdAt', 'updateAt'],
};
const UPDATED_AT_FIELDS_BY_TABLE: Record<string, string[]> = {
  User: ['updatedAt'],
  Project: ['updateAt'],
  Step: ['updatedAt'],
  Task: ['updateAt'],
};

const isProduction = () => process.env.NODE_ENV === 'production';

const adminCredentials = () => ({
  email:
    process.env.ADMIN_EMAIL ??
    (isProduction() ? undefined : 'admin@example.com'),
  password:
    process.env.ADMIN_PASSWORD ?? (isProduction() ? undefined : 'admin123'),
  cookieSecret:
    process.env.ADMIN_COOKIE_SECRET ??
    (isProduction() ? undefined : 'adminjs-development-cookie-secret'),
});

const databaseConfig = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('Set DATABASE_URL to enable AdminJS.');
  }

  const url = new URL(process.env.DATABASE_URL);

  return {
    connectionString: process.env.DATABASE_URL,
    database: decodeURIComponent(url.pathname.replace(/^\//, '')),
  };
};

const isBcryptHash = (password: string) =>
  password.startsWith('$2a$') ||
  password.startsWith('$2b$') ||
  password.startsWith('$2y$');

const hashPasswordPayload = async (request: {
  payload?: Record<string, unknown>;
}) => {
  const passwordHash = request.payload?.passwordHash;

  if (typeof passwordHash !== 'string') {
    return request;
  }

  if (!passwordHash.trim()) {
    delete request.payload?.passwordHash;
    return request;
  }

  if (!isBcryptHash(passwordHash)) {
    request.payload = {
      ...request.payload,
      passwordHash: await hash(passwordHash, 10),
    };
  }

  return request;
};

const prepareCreatePayload =
  (tableName: string) =>
  async (request: { payload?: Record<string, unknown> }) => {
    const now = new Date().toISOString();

    request.payload = {
      id: randomUUID(),
      ...request.payload,
    };

    for (const field of TIMESTAMP_FIELDS_BY_TABLE[tableName] ?? []) {
      if (!request.payload[field]) {
        request.payload[field] = now;
      }
    }

    return hashPasswordPayload(request);
  };

const prepareEditPayload =
  (tableName: string) =>
  async (request: { payload?: Record<string, unknown> }) => {
    if (!request.payload) {
      return request;
    }

    const now = new Date().toISOString();

    for (const field of UPDATED_AT_FIELDS_BY_TABLE[tableName] ?? []) {
      request.payload[field] = now;
    }

    return hashPasswordPayload(request);
  };

const baseResourceOptions = (tableName: string) => ({
  actions: {
    new: { before: prepareCreatePayload(tableName) },
    edit: { before: prepareEditPayload(tableName) },
  },
});

const hiddenTimestampProperties = (tableName: string) => {
  return Object.fromEntries(
    (TIMESTAMP_FIELDS_BY_TABLE[tableName] ?? []).map((field) => [
      field,
      { isVisible: false },
    ]),
  );
};

const resourceOptions = (tableName: string) => {
  const baseOptions = baseResourceOptions(tableName);

  if (tableName === 'User') {
    return {
      ...baseOptions,
      properties: {
        ...hiddenTimestampProperties(tableName),
        passwordHash: {
          isVisible: {
            list: false,
            filter: false,
            show: false,
            edit: true,
          },
        },
        verificationCodeHash: { isVisible: false },
        verificationExpiresAt: { isVisible: false },
      },
    };
  }

  if (tableName === 'ProjectMember') {
    return {
      ...baseOptions,
      properties: {
        ...hiddenTimestampProperties(tableName),
        role: {
          availableValues: [
            { label: 'Owner', value: 'OWNER' },
            { label: 'Admin', value: 'ADMIN' },
            { label: 'Member', value: 'MEMBER' },
          ],
        },
      },
    };
  }

  return {
    ...baseOptions,
    properties: hiddenTimestampProperties(tableName),
  };
};

export async function setupAdmin(app: INestApplication) {
  const [
    { default: AdminJS, Router: AdminRouter },
    AdminJSExpress,
    sqlAdapter,
  ] = await Promise.all([
    import('adminjs'),
    import('@adminjs/express'),
    import('@adminjs/sql') as Promise<SqlModule>,
  ]);

  const { default: Adapter, Database, Resource } = sqlAdapter;

  AdminJS.registerAdapter({ Database, Resource });

  const db = await new Adapter('postgresql', databaseConfig()).init();
  const admin = new AdminJS({
    rootPath: ADMIN_ROOT_PATH,
    branding: {
      companyName: 'Task Manager',
      withMadeWithLove: false,
    },
    resources: TABLES.map((tableName) => ({
      resource: db.table(tableName),
      options: resourceOptions(tableName),
    })),
  });

  const { email, password, cookieSecret } = adminCredentials();

  if (!email || !password || !cookieSecret) {
    throw new Error(
      'Set ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_COOKIE_SECRET to enable AdminJS in production.',
    );
  }

  const router = AdminJSExpress.default.buildAuthenticatedRouter(
    admin,
    {
      authenticate: async (loginEmail: string, loginPassword: string) => {
        const isEmailValid = loginEmail === email;
        const isPasswordValid = isBcryptHash(password)
          ? await compare(loginPassword, password)
          : loginPassword === password;

        if (!isEmailValid || !isPasswordValid) {
          return null;
        }

        return { email };
      },
      cookieName: 'adminjs',
      cookiePassword: cookieSecret,
    },
    null,
    {
      resave: false,
      saveUninitialized: false,
      secret: cookieSecret,
    },
  );

  for (const asset of AdminRouter.assets) {
    app.use(
      `${admin.options.rootPath}${asset.path}`,
      (_request: Request, response: Response) => {
        if (!existsSync(asset.src)) {
          return response.status(404).send('AdminJS asset not found');
        }

        response.type(asset.src);
        return createReadStream(asset.src).pipe(response);
      },
    );
  }

  app.use(admin.options.rootPath, router);
}
