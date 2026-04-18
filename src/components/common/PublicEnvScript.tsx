import { getPublicRuntimeEnv } from '@/config/publicRuntimeEnv.server';

const serialize = (value: unknown): string => JSON.stringify(value).replace(/</g, '\\u003c');

const PublicEnvScript = () => {
  const env = getPublicRuntimeEnv();
  return (
    <meta
      id="pathfinder-public-env"
      name="pathfinder-public-env"
      data-public-env={serialize(env)}
    />
  );
};

export default PublicEnvScript;
