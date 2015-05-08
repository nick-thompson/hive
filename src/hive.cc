#include <nan.h>
#include "hive.h"

using namespace v8;

class HiveWorker : public NanAsyncWorker {
 public:
  HiveWorker(NanCallback* callback, std::string path, char* buf, size_t len)
    : NanAsyncWorker(callback), path(path), buf(buf), len(len) {}
  ~HiveWorker() {}

  // Executed inside the worker-thread.
  void Execute () {
    res = buf;
  }

  // Executed when the async work is complete, inside the main thread.
  void HandleOKCallback () {
    NanScope();

    Local<Value> argv[] = {
        NanNull()
      , NanBufferUse(res, len)
    };

    callback->Call(2, argv);
  }

 private:
  std::string path;
  char* buf;
  size_t len;
  char* res;
};

NAN_METHOD(Take) {
  NanScope();

  if (args.Length() != 3) {
    NanThrowTypeError("Expected three arguments.");
    NanReturnUndefined();
  }

  if (!args[0]->IsString() || !args[2]->IsFunction()) {
    NanThrowTypeError("Received arguments of the wrong type.");
    NanReturnUndefined();
  }

  String::Utf8Value p(args[0]->ToString());
  std::string path(*p);

  char* buf = node::Buffer::Data(args[1]);
  size_t len = node::Buffer::Length(args[1]);
  NanCallback *callback = new NanCallback(args[2].As<Function>());

  NanAsyncQueueWorker(new HiveWorker(callback, path, buf, len));
  NanReturnUndefined();
}
