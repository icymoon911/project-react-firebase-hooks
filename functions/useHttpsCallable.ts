import {
  Functions,
  httpsCallable,
  HttpsCallableResult,
} from 'firebase/functions';
import { useAction } from '../util';

export type HttpsCallableHook<
  RequestData = unknown,
  ResponseData = unknown
> = Readonly<
  [
    (
      data?: RequestData
    ) => Promise<HttpsCallableResult<ResponseData> | undefined>,
    boolean,
    Error | undefined
  ]
>;

export default <RequestData = unknown, ResponseData = unknown>(
  functions: Functions,
  name: string
): HttpsCallableHook<RequestData, ResponseData> => {
  const { action, loading, error } = useAction<
    [RequestData?],
    HttpsCallableResult<ResponseData>,
    Error
  >(
    async (data?: RequestData) => {
      const callable = httpsCallable<RequestData, ResponseData>(
        functions,
        name
      );
      return await callable(data);
    },
    [functions, name]
  );

  return [action, loading, error] as const;
};
