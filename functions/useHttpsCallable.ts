import {
  Functions,
  httpsCallable,
  HttpsCallableResult,
} from 'firebase/functions';
import { useAction } from '../util';

export type HttpsCallableHook<
  RequestData = unknown,
  ResponseData = unknown
> = [
  (
    data?: RequestData
  ) => Promise<HttpsCallableResult<ResponseData> | undefined>,
  boolean,
  Error | undefined
];

export default <RequestData = unknown, ResponseData = unknown>(
  functions: Functions,
  name: string
): HttpsCallableHook<RequestData, ResponseData> => {
  const [callCallable, , loading, error] = useAction<
    [RequestData | undefined],
    HttpsCallableResult<ResponseData>,
    Error
  >(
    async (data?: RequestData) => {
      const callable = httpsCallable<RequestData, ResponseData>(
        functions,
        name
      );
      return callable(data);
    },
    [functions, name]
  );

  return [callCallable, loading, error];
};
