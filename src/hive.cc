#include <nan.h>
#include <fstream>
#include "hive.h"

using namespace v8;

static uv_key_t isolate_cache_key;
static uv_key_t context_cache_key;
static uv_once_t key_guard;

static std::ifstream f("node_modules/babel-core/browser.js");
static std::string babel(
    (std::istreambuf_iterator<char>(f)), std::istreambuf_iterator<char>());

static void create_keys() {
  (void) uv_key_create(&isolate_cache_key);
  (void) uv_key_create(&context_cache_key);
}

static Persistent<Context>* get_context(Isolate* isolate) {
  Persistent<Context>* context =
    (Persistent<Context> *) uv_key_get(&context_cache_key);

  if (context == NULL) {
    Local<Context> ctx = Context::New(isolate);
    context = new Persistent<Context>(isolate, ctx);

    Context::Scope context_scope(ctx);
    Local<Script> script = Script::Compile(
        String::NewFromUtf8(isolate, babel.c_str()));

    (void) script->Run();
    uv_key_set(&context_cache_key, context);
  }

  return context;
}

class HiveWorker : public NanAsyncWorker {
 public:
  HiveWorker(NanCallback* callback, std::string path, char* buf, size_t len)
    : NanAsyncWorker(callback), path(path), buf(buf), len(len) {}
  ~HiveWorker() {}

  // Executed inside the worker-thread.
  void Execute () {
    (void) uv_once(&key_guard, create_keys);

    Isolate* isolate = (Isolate *)uv_key_get(&isolate_cache_key);
    if (isolate == NULL) {
      isolate = Isolate::New();
      uv_key_set(&isolate_cache_key, isolate);
    }

    Locker locker(isolate);
    Isolate::Scope isolate_scope(isolate);
    HandleScope handle_scope(isolate);

    Persistent<Context>* context = get_context(isolate);
    Context::Scope context_scope(Local<Context>::New(isolate, *context));

    Local<String> source = String::NewFromUtf8(
        isolate, buf, String::kNormalString, len);

    Local<Script> script = Script::Compile(source);
    Local<Value> result = script->Run();

    res = result->IntegerValue();
    v8::Unlocker unlocker(isolate);
  }

  // Executed when the async work is complete, inside the main thread.
  void HandleOKCallback () {
    NanScope();

    Local<Value> argv[] = {
        NanNull(),
        NanNew<Number>(res)
    };

    callback->Call(2, argv);
  }

 private:
  std::string path;
  char* buf;
  size_t len;
  int64_t res;
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
