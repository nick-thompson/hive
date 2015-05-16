#include <nan.h>
#include "hive.h"

using namespace v8;

void Init(Handle<Object> exports) {
  exports->Set(NanNew<String>("eval"),
    NanNew<FunctionTemplate>(Eval)->GetFunction());
}

NODE_MODULE(addon, Init)
