import minimist from 'minimist';

export type Service = {
  name: string;
  version: string;
};

interface ParsedArgs {
  command: string;
  services: Service[];
}

const args = async (argv: string[]): Promise<ParsedArgs> => {
  const [command, ...args] = process.argv.slice(2);

  const parsed = minimist(args, {
    alias: {
      t: 'services',
    },
    string: ['services'],
  });

  const { services } = parsed;

  const servicesList: string[] = services ? services.split(',') : [];

  return {
    services: servicesList.map((s) => {
      const [name, version] = s.split('_');
      return { name, version };
    }),
    command,
  };
};

export default args;
