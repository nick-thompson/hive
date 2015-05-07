#include <nan.h>
#include "hive.h"

using namespace v8;

void Init(Handle<Object> exports) {
  exports->Set(NanNew<String>("take"),
    NanNew<FunctionTemplate>(Take)->GetFunction());
}

NODE_MODULE(addon, Init)
