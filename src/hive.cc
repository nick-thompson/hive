#include <nan.h>
#include "hive.h"

using namespace v8;

class HiveWorker : public NanAsyncWorker {
 public:
  HiveWorker(NanCallback* callback, char* buf)
    : NanAsyncWorker(callback), buf(buf) {}
  ~HiveWorker() {}

  // Executed inside the worker-thread.
  void Execute () {
    uint32_t path_len = buf[0] << 24 | buf[1] << 16 | buf[2] << 8 | buf[3];
    res = buf;
    rlen = path_len + 4;
  }

  // Executed when the async work is complete, inside the main thread.
  void HandleOKCallback () {
    NanScope();

    Local<Value> argv[] = {
        NanNull()
      , NanBufferUse(res, rlen)
    };

    callback->Call(2, argv);
  }

 private:
  char* buf;
  char* res;
  uint32_t rlen;
};

NAN_METHOD(Take) {
  NanScope();

  char* buf = node::Buffer::Data(args[0]);
  NanCallback *callback = new NanCallback(args[1].As<Function>());

  NanAsyncQueueWorker(new HiveWorker(callback, buf));
  NanReturnUndefined();
}
